/**
 * @module botkit
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Botkit, BotkitMessage } from './core';
import { BotWorker } from './botworker';
import { BotkitDialogWrapper } from './dialogWrapper';
import { Activity, ActivityTypes, TurnContext, MessageFactory, ActionTypes } from 'botbuilder';
import { Dialog, DialogContext, DialogReason, PromptValidatorContext, ActivityPrompt, DialogTurnStatus } from 'botbuilder-dialogs';
import * as mustache from 'mustache';
import * as Debug from 'debug';

const debug = Debug('botkit:conversation');

/**
 * Definition of the handler functions used to handle .ask and .addQuestion conditions
 */
interface BotkitConvoHandler {
    (answer: string, convo: BotkitDialogWrapper, bot: BotWorker, message: BotkitMessage): Promise<any>;
}

/**
 * Definition of the trigger pattern passed into .ask or .addQuestion
 */
interface BotkitConvoTrigger {
    type?: string;
    pattern?: string | RegExp;
    handler: BotkitConvoHandler;
    default?: boolean;
}

/**
 * Template for definiting a BotkitConversation template
 */
interface BotkitMessageTemplate {
    text: ((template: any, vars: any) => string) | string[];
    action?: string;
    execute?: {
        script: string;
        thread?: string;
    };
    quick_replies?: ((template: any, vars: any) => any[]) | any[];
    attachments?: ((template: any, vars: any) => any[]) | any[];
    blocks?: ((template: any, vars: any) => any[]) | any[];
    attachment?: ((template: any, vars: any) => any) | any;
    attachmentLayout?: string;
    channelData?: any;
    collect: {
        key?: string;
        options?: BotkitConvoTrigger[];
    };
}

export interface BotkitConversationStep {
    /**
     * The number pointing to the current message in the current thread in this dialog's script
     */
    index: number;
    /**
     * The name of the current thread
     */
    thread: string;
    /**
     * The length of the current thread
     */
    threadLength: number;
    /**
     * A pointer to the current dialog state
     */
    state: any;
    /**
     * A pointer to any options passed into the dialog when it began
     */
    options: any;
    /**
     * The reason for this step being called
     */
    reason: DialogReason;
    /**
     * The results of the previous turn
     */
    result: any;
    /**
     * A pointer directly to state.values
     */
    values: any;
    /**
     * A function to call when the step is completed.
     */
    next: (stepResult) => Promise<any>;
}

/**
 * An extension on the [BotBuilder Dialog Class](https://docs.microsoft.com/en-us/javascript/api/botbuilder-dialogs/dialog?view=botbuilder-ts-latest) that provides a Botkit-friendly interface for
 * defining and interacting with multi-message dialogs. Dialogs can be constructed using `say()`, `ask()` and other helper methods.
 *
 * ```javascript
 * // define the structure of your dialog...
 * const convo = new BotkitConversation('foo', controller);
 * convo.say('Hello!');
 * convo.ask('What is your name?', async(answer, convo, bot) => {
 *      await bot.say('Your name is ' + answer);
 * });
 * controller.dialogSet.add(convo);
 *
 * // later on, trigger this dialog by its id
 * controller.on('event', async(bot, message) => {
 *  await bot.beginDialog('foo');
 * })
 * ```
 */
export class BotkitConversation<O extends object = {}> extends Dialog<O> {
    /**
     * A map of every message in the dialog, broken into threads
     */
    public script: any; // TODO: define this with typedefs

    private _prompt: string;
    private _beforeHooks: {};
    private _afterHooks: { (context: TurnContext, results: any): void }[];
    private _changeHooks: {};
    private _controller: Botkit;

    /**
     * Create a new BotkitConversation object
     * @param dialogId A unique identifier for this dialog, used to later trigger this dialog
     * @param controller A pointer to the main Botkit controller
     */
    public constructor(dialogId: string, controller: Botkit) {
        super(dialogId);

        this._beforeHooks = {};
        this._afterHooks = [];
        this._changeHooks = {};
        this.script = {};

        this._controller = controller;

        // Make sure there is a prompt we can use.
        // TODO: maybe this ends up being managed by Botkit
        this._prompt = this.id + '_default_prompt';
        this._controller.dialogSet.add(new ActivityPrompt(
            this._prompt,
            (prompt: PromptValidatorContext<Activity>) => Promise.resolve(prompt.recognized.succeeded === true)
        ));

        return this;
    }

    /**
     * Add a non-interactive message to the default thread.
     * Messages added with `say()` and `addMessage()` will _not_ wait for a response, will be sent one after another without a pause.
     *
     * [Learn more about building conversations &rarr;](../conversations.md#build-a-conversation)
     *
     * ```javascript
     * let conversation = new BotkitConversation('welcome', controller);
     * conversation.say('Hello! Welcome to my app.');
     * conversation.say('Let us get started...');
     * ```
     *
     * @param message Message template to be sent
     */
    public say(message: Partial<BotkitMessageTemplate> | string): BotkitConversation {
        this.addMessage(message, 'default');
        return this;
    }

    /**
     * An an action to the conversation timeline. This can be used to go to switch threads or end the dialog.
     *
     * When provided the name of another thread in the conversation, this will cause the bot to go immediately
     * to that thread.
     *
     * Otherwise, use one of the following keywords:
     * * `stop`
     * * `repeat`
     * * `complete`
     * * `timeout`
     *
     * [Learn more about building conversations &rarr;](../conversations.md#build-a-conversation)
     *
     * ```javascript
     *
     * // go to a thread called "next_thread"
     * convo.addAction('next_thread');
     *
     * // end the conversation and mark as successful
     * convo.addAction('complete');
     * ```
     * @param action An action or thread name
     * @param thread_name The name of the thread to which this action is added.  Defaults to `default`
     */
    public addAction(action: string, thread_name = 'default'): BotkitConversation {
        this.addMessage({ action: action }, thread_name);
        return this;
    }

    /**
     * Cause the dialog to call a child dialog, wait for it to complete,
     * then store the results in a variable and resume the parent dialog.
     * Use this to [combine multiple dialogs into bigger interactions.](../conversations.md#composing-dialogs)
     *
     * [Learn more about building conversations &rarr;](../conversations.md#build-a-conversation)
     * ```javascript
     * // define a profile collection dialog
     * let profileDialog = new BotkitConversation('PROFILE_DIALOG', controller);
     * profileDialog.ask('What is your name?', async(res, convo, bot) => {}, {key: 'name'});
     * profileDialog.ask('What is your age?', async(res, convo, bot) => {}, {key: 'age'});
     * profileDialog.ask('What is your location?', async(res, convo, bot) => {}, {key: 'location'});
     * controller.addDialog(profileDialog);
     *
     * let onboard = new BotkitConversation('ONBOARDING', controller);
     * onboard.say('Hello! It is time to collect your profile data.');
     * onboard.addChildDialog('PROFILE_DIALOG', 'profile');
     * onboard.say('Hello, {{vars.profile.name}}! Onboarding is complete.');
     * ```
     *
     * @param dialog_id the id of another dialog
     * @param key_name the variable name in which to store the results of the child dialog. if not provided, defaults to dialog_id.
     * @param thread_name the name of a thread to which this call should be added. defaults to 'default'
     */
    public addChildDialog(dialog_id: string, key_name?: string, thread_name = 'default'): BotkitConversation {
        this.addQuestion({
            action: 'beginDialog',
            execute: {
                script: dialog_id
            }
        }, [], { key: key_name || dialog_id }, thread_name);

        return this;
    }

    /**
     * Cause the current dialog to handoff to another dialog.
     * The parent dialog will not resume when the child dialog completes. However, the afterDialog event will not fire for the parent dialog until all child dialogs complete.
     * Use this to [combine multiple dialogs into bigger interactions.](../conversations.md#composing-dialogs)
     *
     * [Learn more about building conversations &rarr;](../conversations.md#build-a-conversation)
     * ```javascript
     * let parent = new BotkitConversation('parent', controller);
     * let child = new BotkitConversation('child', controller);
     * parent.say('Moving on....');
     * parent.addGotoDialog('child');
     * ```
     *
     * @param dialog_id the id of another dialog
     * @param thread_name the name of a thread to which this call should be added. defaults to 'default'
     */
    public addGotoDialog(dialog_id: string, thread_name = 'default'): BotkitConversation {
        this.addMessage({
            action: 'execute_script',
            execute: {
                script: dialog_id
            }
        }, thread_name);

        return this;
    }

    /**
     * Add a message template to a specific thread.
     * Messages added with `say()` and `addMessage()` will be sent one after another without a pause.
     *
     * [Learn more about building conversations &rarr;](../conversations.md#build-a-conversation)
     * ```javascript
     * let conversation = new BotkitConversation('welcome', controller);
     * conversation.say('Hello! Welcome to my app.');
     * conversation.say('Let us get started...');
     * // pass in a message with an action that will cause gotoThread to be called...
     * conversation.addAction('continuation');
     *
     * conversation.addMessage('This is a different thread completely', 'continuation');
     * ```
     *
     * @param message Message template to be sent
     * @param thread_name Name of thread to which message will be added
     */
    public addMessage(message: Partial<BotkitMessageTemplate> | string, thread_name: string): BotkitConversation {
        if (!thread_name) {
            thread_name = 'default';
        }

        if (!this.script[thread_name]) {
            this.script[thread_name] = [];
        }

        if (typeof (message) === 'string') {
            message = { text: [message] };
        }

        this.script[thread_name].push(message);

        return this;
    }

    /**
     * Add a question to the default thread.
     * In addition to a message template, receives either a single handler function to call when an answer is provided,
     * or an array of handlers paired with trigger patterns. When providing multiple conditions to test, developers may also provide a
     * handler marked as the default choice.
     *
     * [Learn more about building conversations &rarr;](../conversations.md#build-a-conversation)
     * ```javascript
     * // ask a question, handle the response with a function
     * convo.ask('What is your name?', async(response, convo, bot, full_message) => {
     *  await bot.say('Oh your name is ' + response);
     * }, {key: 'name'});
     *
     * // ask a question, evaluate answer, take conditional action based on response
     * convo.ask('Do you want to eat a taco?', [
     *  {
     *      pattern: 'yes',
     *      type: 'string',
     *      handler: async(response_text, convo, bot, full_message) => {
     *          return await convo.gotoThread('yes_taco');
     *      }
     *  },
     *  {
     *      pattern: 'no',
     *      type: 'string',
     *      handler: async(response_text, convo, bot, full_message) => {
     *          return await convo.gotoThread('no_taco');
     *      }
     *   },
     *   {
     *       default: true,
     *       handler: async(response_text, convo, bot, full_message) => {
     *           await bot.say('I do not understand your response!');
     *           // start over!
     *           return await convo.repeat();
     *       }
     *   }
     * ], {key: 'tacos'});
     * ```
     *
     * @param message a message that will be used as the prompt
     * @param handlers one or more handler functions defining possible conditional actions based on the response to the question.
     * @param key name of variable to store response in.
     */
    public ask(message: Partial<BotkitMessageTemplate> | string, handlers: BotkitConvoHandler | BotkitConvoTrigger[], key: {key: string} | string | null): BotkitConversation {
        this.addQuestion(message, handlers, key, 'default');
        return this;
    }

    /**
     * Identical to [ask()](#ask), but accepts the name of a thread to which the question is added.
     *
     * [Learn more about building conversations &rarr;](../conversations.md#build-a-conversation)
     * @param message A message that will be used as the prompt
     * @param handlers One or more handler functions defining possible conditional actions based on the response to the question
     * @param key Name of variable to store response in.
     * @param thread_name Name of thread to which message will be added
     */
    public addQuestion(message: Partial<BotkitMessageTemplate> | string, handlers: BotkitConvoHandler | BotkitConvoTrigger[], key: {key: string} | string | null, thread_name: string): BotkitConversation {
        if (!thread_name) {
            thread_name = 'default';
        }

        if (!this.script[thread_name]) {
            this.script[thread_name] = [];
        }

        if (typeof (message) === 'string') {
            message = { text: [message as string] };
        }

        message.collect = {};

        if (key) {
            message.collect = {
                key: typeof (key) === 'string' ? key : key.key
            };
        }

        if (Array.isArray(handlers)) {
            message.collect.options = handlers;
        } else if (typeof (handlers) === 'function') {
            message.collect.options = [
                {
                    default: true,
                    handler: handlers
                }
            ];
        } else {
            throw new Error('Unsupported handlers type: ' + typeof (handlers));
        }

        // ensure all options have a type field
        message.collect.options.forEach((o) => { if (!o.type) { o.type = 'string'; } });

        this.script[thread_name].push(message);

        // add a null message where the handlers for the previous message will fire.
        this.script[thread_name].push({ action: 'next' });

        return this;
    }

    /**
     * Register a handler function that will fire before a given thread begins.
     * Use this hook to set variables, call APIs, or change the flow of the conversation using `convo.gotoThread`
     *
     * ```javascript
     * convo.addMessage('This is the foo thread: var == {{vars.foo}}', 'foo');
     * convo.before('foo', async(convo, bot) => {
     *  // set a variable here that can be used in the message template
     *  convo.setVar('foo','THIS IS FOO');
     *
     * });
     * ```
     *
     * @param thread_name A valid thread defined in this conversation
     * @param handler A handler function in the form async(convo, bot) => { ... }
     */
    public before(thread_name: string, handler: (convo: BotkitDialogWrapper, bot: BotWorker) => Promise<any>): void {
        if (!this._beforeHooks[thread_name]) {
            this._beforeHooks[thread_name] = [];
        }

        this._beforeHooks[thread_name].push(handler);
    }

    /**
     * This private method is called before a thread begins, and causes any bound handler functions to be executed.
     * @param thread_name the thread about to begin
     * @param dc the current DialogContext
     * @param step the current step object
     */
    private async runBefore(thread_name: string, dc: DialogContext, step: BotkitConversationStep): Promise<void> {
        debug('Before:', this.id, thread_name);

        if (this._beforeHooks[thread_name]) {
            // spawn a bot instance so devs can use API or other stuff as necessary
            const bot = await this._controller.spawn(dc);

            // create a convo controller object
            const convo = new BotkitDialogWrapper(dc, step);

            for (let h = 0; h < this._beforeHooks[thread_name].length; h++) {
                const handler = this._beforeHooks[thread_name][h];
                await handler.call(this, convo, bot);
            }
        }
    }

    /**
     * Bind a function to run after the dialog has completed.
     * The first parameter to the handler will include a hash of all variables set and values collected from the user during the conversation.
     * The second parameter to the handler is a BotWorker object that can be used to start new dialogs or take other actions.
     *
     * [Learn more about handling end of conversation](../conversations.md#handling-end-of-conversation)
     * ```javascript
     * let convo = new BotkitConversation(MY_CONVO, controller);
     * convo.ask('What is your name?', [], 'name');
     * convo.ask('What is your age?', [], 'age');
     * convo.ask('What is your favorite color?', [], 'color');
     * convo.after(async(results, bot) => {
     *
     *      // handle results.name, results.age, results.color
     *
     * });
     * controller.addDialog(convo);
     * ```
     *
     * @param handler in the form async(results, bot) { ... }
     */
    public after(handler: (results: any, bot: BotWorker) => void): void {
        this._afterHooks.push(handler);
    }

    /**
     * This private method is called at the end of the conversation, and causes any bound handler functions to be executed.
     * @param context the current dialog context
     * @param results an object containing the final results of the dialog
     */
    private async runAfter(context: DialogContext, results: any): Promise<void> {
        debug('After:', this.id);
        if (this._afterHooks.length) {
            const bot = await this._controller.spawn(context);
            for (let h = 0; h < this._afterHooks.length; h++) {
                const handler = this._afterHooks[h];
                await handler.call(this, results, bot);
            }
        }
    }

    /**
     * Bind a function to run whenever a user answers a specific question.  Can be used to validate input and take conditional actions.
     *
     * ```javascript
     * convo.ask('What is your name?', [], 'name');
     * convo.onChange('name', async(response, convo, bot) => {
     *
     *  // user changed their name!
     *  // do something...
     *
     * });
     * ```
     * @param variable name of the variable to watch for changes
     * @param handler a handler function that will fire whenever a user's response is used to change the value of the watched variable
     */
    public onChange(variable: string, handler: (response, convo, bot) => Promise<any>): void {
        if (!this._changeHooks[variable]) {
            this._changeHooks[variable] = [];
        }

        this._changeHooks[variable].push(handler);
    }

    /**
     * This private method is responsible for firing any bound onChange handlers when a variable changes
     * @param variable the name of the variable that is changing
     * @param value the new value of the variable
     * @param dc the current DialogContext
     * @param step the current step object
     */
    private async runOnChange(variable: string, value: any, dc: DialogContext, step: BotkitConversationStep): Promise<void> {
        debug('OnChange:', this.id, variable);

        if (this._changeHooks[variable] && this._changeHooks[variable].length) {
            // spawn a bot instance so devs can use API or other stuff as necessary
            const bot = await this._controller.spawn(dc);

            // create a convo controller object
            const convo = new BotkitDialogWrapper(dc, step);

            for (let h = 0; h < this._changeHooks[variable].length; h++) {
                const handler = this._changeHooks[variable][h];
                await handler.call(this, value, convo, bot);
            }
        }
    }

    /**
     * Called automatically when a dialog begins. Do not call this directly!
     * @ignore
     * @param dc the current DialogContext
     * @param options an object containing initialization parameters passed to the dialog. may include `thread` which will cause the dialog to begin with that thread instead of the `default` thread.
     */
    public async beginDialog(dc: DialogContext, options: any): Promise<any> {
        // Initialize the state
        const state = dc.activeDialog.state;
        state.options = options || {};
        state.values = { ...options };

        // Run the first step
        return await this.runStep(dc, 0, state.options.thread || 'default', DialogReason.beginCalled);
    }

    /**
     * Called automatically when an already active dialog is continued. Do not call this directly!
     * @ignore
     * @param dc the current DialogContext
     */
    public async continueDialog(dc: DialogContext): Promise<any> {
        // Don't do anything for non-message activities
        if (dc.context.activity.type !== ActivityTypes.Message) {
            return Dialog.EndOfTurn;
        }

        // Run next step with the message text as the result.
        return await this.resumeDialog(dc, DialogReason.continueCalled, dc.context.activity);
    }

    /**
     * Called automatically when a dialog moves forward a step. Do not call this directly!
     * @ignore
     * @param dc The current DialogContext
     * @param reason Reason for resuming the dialog
     * @param result Result of previous step
     */
    public async resumeDialog(dc, reason, result): Promise<any> {
        // Increment step index and run step
        if (dc.activeDialog) {
            const state = dc.activeDialog.state;
            return await this.runStep(dc, state.stepIndex + 1, state.thread || 'default', reason, result);
        } else {
            return Dialog.EndOfTurn;
        }
    }

    /**
     * Called automatically to process the turn, interpret the script, and take any necessary actions based on that script. Do not call this directly!
     * @ignore
     * @param dc The current dialog context
     * @param step The current step object
     */
    private async onStep(dc, step): Promise<any> {
        // Let's interpret the current line of the script.
        const thread = this.script[step.thread];

        if (!thread) {
            throw new Error(`Thread '${ step.thread }' not found, did you add any messages to it?`);
        }

        // Capture the previous step value if there previous line included a prompt
        const previous = (step.index >= 1) ? thread[step.index - 1] : null;
        if (step.result && previous && previous.collect) {
            if (previous.collect.key) {
                // capture before values
                const index = step.index;
                const thread_name = step.thread;

                // capture the user input value into the array
                if (step.values[previous.collect.key] && previous.collect.multiple) {
                    step.values[previous.collect.key] = [step.values[previous.collect.key], step.result].join('\n');
                } else {
                    step.values[previous.collect.key] = step.result;
                }

                // run onChange handlers
                await this.runOnChange(previous.collect.key, step.result, dc, step);

                // did we just change threads? if so, restart this turn
                if (index !== step.index || thread_name !== step.thread) {
                    return await this.runStep(dc, step.index, step.thread, DialogReason.nextCalled);
                }
            }

            // handle conditions of previous step
            if (previous.collect.options) {
                const paths = previous.collect.options.filter((option) => { return !option.default === true; });
                const default_path = previous.collect.options.filter((option) => { return option.default === true; })[0];
                let path = null;

                for (let p = 0; p < paths.length; p++) {
                    const condition = paths[p];
                    let test;
                    if (condition.type === 'string') {
                        test = new RegExp(condition.pattern, 'i');
                    } else if (condition.type === 'regex') {
                        test = new RegExp(condition.pattern, 'i');
                    }
                    // TODO: Allow functions to be passed in as patterns
                    // ie async(test) => Promise<boolean>

                    if (step.result && typeof (step.result) === 'string' && step.result.match(test)) {
                        path = condition;
                        break;
                    }
                }

                // take default path if one is set
                if (!path) {
                    path = default_path;
                }

                if (path) {
                    if (path.action !== 'wait' && previous.collect && previous.collect.multiple) {
                        // TODO: remove the final line of input
                        // since this would represent the "end" message and probably not part of the input
                    }

                    const res = await this.handleAction(path, dc, step);
                    if (res !== false) {
                        return res;
                    }
                }
            }
        }

        // was the dialog canceled during the last action?
        if (!dc.activeDialog) {
            return await this.end(dc);
        }

        // Handle the current step
        if (step.index < thread.length) {
            const line = thread[step.index];

            // If a prompt is defined in the script, use dc.prompt to call it.
            // This prompt must be a valid dialog defined somewhere in your code!
            if (line.collect && line.action !== 'beginDialog') {
                try {
                    return await dc.prompt(this._prompt, await this.makeOutgoing(dc, line, step.values));
                } catch (err) {
                    console.error(err);
                    await dc.context.sendActivity(`Failed to start prompt ${ this._prompt }`);
                    return await step.next();
                }
                // If there's nothing but text, send it!
                // This could be extended to include cards and other activity attributes.
            } else {
                // if there is text, attachments, or any channel data fields at all...
                if (line.type || line.text || line.attachments || line.attachment || line.blocks || (line.channelData && Object.keys(line.channelData).length)) {
                    await dc.context.sendActivity(await this.makeOutgoing(dc, line, step.values));
                } else if (!line.action) {
                    console.error('Dialog contains invalid message', line);
                }

                if (line.action) {
                    const res = await this.handleAction(line, dc, step);
                    if (res !== false) {
                        return res;
                    }
                }

                return await step.next();
            }
        } else {
            // End of script so just return to parent
            return await this.end(dc);
        }
    }

    /**
     * Run a dialog step, based on the index and thread_name passed in.
     * @param dc The current DialogContext
     * @param index The index of the current step
     * @param thread_name The name of the current thread
     * @param reason The reason given for running this step
     * @param result The result of the previous turn if any
     */
    private async runStep(dc: DialogContext, index: number, thread_name: string, reason: DialogReason, result?: any): Promise<any> {
        // Update the step index
        const state = dc.activeDialog.state;
        state.stepIndex = index;
        state.thread = thread_name;
        // Create step context
        const nextCalled = false;
        const step = {
            index: index,
            threadLength: this.script[thread_name].length,
            thread: thread_name,
            state: state,
            options: state.options,
            reason: reason,
            result: result && result.text ? result.text : result,
            resultObject: result,
            values: state.values,
            next: async (stepResult): Promise<any> => {
                if (nextCalled) {
                    throw new Error(`ScriptedStepContext.next(): method already called for dialog and step '${ this.id }[${ index }]'.`);
                }
                return await this.resumeDialog(dc, DialogReason.nextCalled, stepResult);
            }
        };

        // did we just start a new thread?
        // if so, run the before stuff.
        if (index === 0) {
            await this.runBefore(step.thread, dc, step);

            // did we just change threads? if so, restart
            if (index !== step.index || thread_name !== step.thread) {
                return await this.runStep(dc, step.index, step.thread, DialogReason.nextCalled); // , step.values);
            }
        }

        // Execute step
        const res = await this.onStep(dc, step);

        return res;
    }

    /**
     * Automatically called when the the dialog ends and causes any handlers bound using `after()` to fire. Do not call this directly!
     * @ignore
     * @param dc The current DialogContext
     * @param value The final value collected by the dialog.
     */
    public async end(dc: DialogContext): Promise<DialogTurnStatus> {
        // TODO: may have to move these around
        // shallow copy todo: may need deep copy
        // protect against canceled dialog.
        if (dc.activeDialog && dc.activeDialog.state) {
            const result = {
                ...dc.activeDialog.state.values
            };
            await dc.endDialog(result);
            await this.runAfter(dc, result);
        } else {
            await dc.endDialog();
        }

        return DialogTurnStatus.complete;
    }

    /**
     * Translates a line from the dialog script into an Activity. Responsible for doing token replacement.
     * @param line a message template from the script
     * @param vars an object containing key/value pairs used to do token replacement on fields in the message template
     */
    private async makeOutgoing(dc: DialogContext, line: any, vars: any): Promise<any> {
        let outgoing;
        let text = '';

        // if the text is just a string, use it.
        // otherwise, if it is an array, pick a random element
        if (line.text && typeof (line.text) === 'string') {
            text = line.text;
        // If text is a function, call the function to get the actual text value.
        } else if (line.text && typeof (line.text) === 'function') {
            text = await line.text(line, vars);
        } else if (Array.isArray(line.text)) {
            text = line.text[Math.floor(Math.random() * line.text.length)];
        }

        /*******************************************************************************************************************/
        // use Bot Framework's message factory to construct the initial object.
        if (line.quick_replies && typeof (line.quick_replies) !== 'function') {
            outgoing = MessageFactory.suggestedActions(line.quick_replies.map((reply) => { return { type: ActionTypes.PostBack, title: reply.title, text: reply.payload, displayText: reply.title, value: reply.payload }; }), text);
        } else {
            outgoing = MessageFactory.text(text);
        }

        outgoing.channelData = outgoing.channelData ? outgoing.channelData : {};
        if (line.attachmentLayout) {
            outgoing.attachmentLayout = line.attachmentLayout;
        }
        /*******************************************************************************************************************/
        // allow dynamic generation of quick replies and/or attachments
        if (typeof (line.quick_replies) === 'function') {
            // set both formats of quick replies
            outgoing.channelData.quick_replies = await line.quick_replies(line, vars);
            outgoing.suggestedActions = { actions: outgoing.channelData.quick_replies.map((reply) => { return { type: ActionTypes.PostBack, title: reply.title, text: reply.payload, displayText: reply.title, value: reply.payload }; }) };
        }
        if (typeof (line.attachment) === 'function') {
            outgoing.channelData.attachment = await line.attachment(line, vars);
        }
        if (typeof (line.attachments) === 'function') {
            // set both locations for attachments
            outgoing.attachments = outgoing.channelData.attachments = await line.attachments(line, vars);
        }
        if (typeof (line.blocks) === 'function') {
            outgoing.channelData.blocks = await line.blocks(line, vars);
        }

        /*******************************************************************************************************************/
        // Map some fields into the appropriate places for processing by Botkit/ Bot Framework

        // Quick replies are used by Facebook and Web adapters, but in a different way than they are for Bot Framework.
        // In order to make this as easy as possible, copy these fields for the developer into channelData.
        if (line.quick_replies && typeof (line.quick_replies) !== 'function') {
            outgoing.channelData.quick_replies = JSON.parse(JSON.stringify(line.quick_replies));
        }

        // Similarly, attachment and blocks fields are platform specific.
        // handle slack Block attachments
        if (line.blocks && typeof (line.blocks) !== 'function') {
            outgoing.channelData.blocks = JSON.parse(JSON.stringify(line.blocks));
        }

        // handle facebook attachments.
        if (line.attachment && typeof (line.attachment) !== 'function') {
            outgoing.channelData.attachment = JSON.parse(JSON.stringify(line.attachment));
        }

        // set the type
        if (line.type) {
            outgoing.type = JSON.parse(JSON.stringify(line.type));
        }

        // copy all the values in channelData fields
        if (line.channelData && Object.keys(line.channelData).length > 0) {
            const channelDataParsed = this.parseTemplatesRecursive(JSON.parse(JSON.stringify(line.channelData)), vars);

            outgoing.channelData = {
                ...outgoing.channelData,
                ...channelDataParsed
            };
        }

        /*******************************************************************************************************************/
        // Handle template token replacements
        if (outgoing.text) {
            outgoing.text = mustache.render(outgoing.text, { vars: vars });
        }

        // process templates in native botframework attachments and/or slack attachments
        if (line.attachments && typeof (line.attachments) !== 'function') {
            outgoing.attachments = this.parseTemplatesRecursive(JSON.parse(JSON.stringify(line.attachments)), vars);
        }

        // process templates in slack attachments in channelData
        if (outgoing.channelData.attachments) {
            outgoing.channelData.attachments = this.parseTemplatesRecursive(outgoing.channelData.attachments, vars);
        }
        if (outgoing.channelData.blocks) {
            outgoing.channelData.blocks = this.parseTemplatesRecursive(outgoing.channelData.blocks, vars);
        }

        // process templates in facebook attachments
        if (outgoing.channelData.attachment) {
            outgoing.channelData.attachment = this.parseTemplatesRecursive(outgoing.channelData.attachment, vars);
        }

        // process templates in quick replies
        if (outgoing.channelData.quick_replies) {
            outgoing.channelData.quick_replies = this.parseTemplatesRecursive(outgoing.channelData.quick_replies, vars);
        }
        // process templates in quick replies
        if (outgoing.suggestedActions) {
            outgoing.suggestedActions = this.parseTemplatesRecursive(outgoing.suggestedActions, vars);
        }

        return new Promise((resolve, reject) => {
            // run the outgoing message through the Botkit send middleware
            this._controller.spawn(dc).then((bot) => {
                this._controller.middleware.send.run(bot, outgoing, (err, bot, outgoing) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(outgoing);
                    }
                });
            }).catch(reject);
        });
    }

    /**
     * Responsible for doing token replacements recursively in attachments and other multi-field properties of the message.
     * @param attachments some object or array containing values for which token replacements should be made.
     * @param vars an object defining key/value pairs used for the token replacements
     */
    private parseTemplatesRecursive(attachments: any, vars: any): any {
        if (attachments && attachments.length) {
            for (let a = 0; a < attachments.length; a++) {
                for (const key in attachments[a]) {
                    if (typeof (attachments[a][key]) === 'string') {
                        attachments[a][key] = mustache.render(attachments[a][key], { vars: vars });
                    } else {
                        attachments[a][key] = this.parseTemplatesRecursive(attachments[a][key], vars);
                    }
                }
            }
        } else {
            for (const x in attachments) {
                if (typeof (attachments[x]) === 'string') {
                    attachments[x] = mustache.render(attachments[x], { vars: vars });
                } else {
                    attachments[x] = this.parseTemplatesRecursive(attachments[x], vars);
                }
            }
        }

        return attachments;
    }

    /**
     * Handle the scripted "gotothread" action - requires an additional call to runStep.
     * @param thread The name of the thread to jump to
     * @param dc The current DialogContext
     * @param step The current step object
     */
    private async gotoThreadAction(thread: string, dc: DialogContext, step: BotkitConversationStep): Promise<any> {
        step.thread = thread;
        step.index = 0;

        return await this.runStep(dc, step.index, step.thread, DialogReason.nextCalled, step.values);
    }

    /**
     * Accepts a Botkit script action, and performs that action
     * @param path A conditional path in the form {action: 'some action', handler?: some handler function, maybe_other_fields}
     * @param dc The current DialogContext
     * @param step The current stpe object
     */
    private async handleAction(path, dc, step): Promise<any> {
        let worker = null;
        if (path.handler) {
            const index = step.index;
            const thread_name = step.thread;
            const result = step.result;
            const response = result == null ? null : (result.text || (typeof (result) === 'string' ? result : null));

            // spawn a bot instance so devs can use API or other stuff as necessary
            const bot = await this._controller.spawn(dc);

            // create a convo controller object
            const convo = new BotkitDialogWrapper(dc, step);

            const activedialog = dc.activeDialog.id;

            await path.handler.call(this, response, convo, bot, dc.context.turnState.get('botkitMessage') || dc.context.activity);

            if (!dc.activeDialog) {
                return false;
            }

            // did we change dialogs? if so, return an endofturn because the new dialog has taken over.
            if (activedialog !== dc.activeDialog.id) {
                return Dialog.EndOfTurn;
            }

            // did we just change threads? if so, restart this turn
            if (index !== step.index || thread_name !== step.thread) {
                return await this.runStep(dc, step.index, step.thread, DialogReason.nextCalled, null);
            }

            return false;
        }

        switch (path.action) {
        case 'next':
            // noop
            break;
        case 'complete':
            step.values._status = 'completed';
            return await this.end(dc);
        case 'stop':
            step.values._status = 'canceled';
            return await this.end(dc);
        case 'timeout':
            step.values._status = 'timeout';
            return await this.end(dc);
        case 'execute_script':
            worker = await this._controller.spawn(dc);

            await worker.replaceDialog(path.execute.script, {
                thread: path.execute.thread,
                ...step.values
            });

            return { status: DialogTurnStatus.waiting };
        case 'beginDialog':
            worker = await this._controller.spawn(dc);

            await worker.beginDialog(path.execute.script, {
                thread: path.execute.thread,
                ...step.values
            });
            return { status: DialogTurnStatus.waiting };
        case 'repeat':
            return await this.runStep(dc, step.index - 1, step.thread, DialogReason.nextCalled);
        case 'wait':
            // reset the state so we're still on this step.
            step.state.stepIndex = step.index - 1;
            // send a waiting status
            return { status: DialogTurnStatus.waiting };
        default:
            // the default behavior for unknown action in botkit is to gotothread
            if (this.script[path.action]) {
                return await this.gotoThreadAction(path.action, dc, step);
            }
            console.warn('NOT SURE WHAT TO DO WITH THIS!!', path);
            break;
        }

        return false;
    }
}
