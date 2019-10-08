/**
 * @module botkit
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Botkit } from './core';
import { BotWorker } from './botworker';
import { BotkitDialogWrapper } from './dialogWrapper';
import { Dialog, DialogContext, DialogReason, DialogTurnStatus } from 'botbuilder-dialogs';
/**
 * Definition of the handler functions used to handle .ask and .addQuestion conditions
 */
interface BotkitConvoHandler {
    (answer: string, convo: BotkitDialogWrapper, bot: BotWorker): Promise<any>;
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
    text: string[];
    action?: string;
    execute?: {
        script: string;
        thread?: string;
    };
    quick_replies?: any[];
    attachments?: any[];
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
    next: (stepResult: any) => Promise<any>;
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
export declare class BotkitConversation<O extends object = {}> extends Dialog<O> {
    /**
     * A map of every message in the dialog, broken into threads
     */
    script: any;
    private _prompt;
    private _beforeHooks;
    private _afterHooks;
    private _changeHooks;
    private _controller;
    /**
     * Create a new BotkitConversation object
     * @param dialogId A unique identifier for this dialog, used to later trigger this dialog
     * @param controller A pointer to the main Botkit controller
     */
    constructor(dialogId: string, controller: Botkit);
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
    say(message: Partial<BotkitMessageTemplate> | string): BotkitConversation;
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
    addAction(action: string, thread_name?: string): BotkitConversation;
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
    addChildDialog(dialog_id: string, key_name?: string, thread_name?: string): BotkitConversation;
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
    addGotoDialog(dialog_id: string, thread_name?: string): BotkitConversation;
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
    addMessage(message: Partial<BotkitMessageTemplate> | string, thread_name: string): BotkitConversation;
    /**
     * Add a question to the default thread.
     * In addition to a message template, receives either a single handler function to call when an answer is provided,
     * or an array of handlers paired with trigger patterns. When providing multiple conditions to test, developers may also provide a
     * handler marked as the default choice.
     *
     * [Learn more about building conversations &rarr;](../conversations.md#build-a-conversation)
     * ```javascript
     * // ask a question, handle the response with a function
     * convo.ask('What is your name?', async(response, convo, bot) => {
     *  await bot.say('Oh your name is ' + response);
     * }, {key: 'name'});
     *
     * // ask a question, evaluate answer, take conditional action based on response
     * convo.ask('Do you want to eat a taco?', [
     *  {
     *      pattern: 'yes',
     *      type: 'string',
     *      handler: async(response, convo, bot) => {
     *          return await convo.gotoThread('yes_taco');
     *      }
     *  },
     *  {
     *      pattern: 'no',
     *      type: 'string',
     *      handler: async(response, convo, bot) => {
     *          return await convo.gotoThread('no_taco');
     *      }
     *   },s
     *   {
     *       default: true,
     *       handler: async(response, convo, bot) => {
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
    ask(message: Partial<BotkitMessageTemplate> | string, handlers: BotkitConvoTrigger | BotkitConvoTrigger[], key: {
        key: string;
    } | string | null): BotkitConversation;
    /**
     * Identical to [ask()](#ask), but accepts the name of a thread to which the question is added.
     *
     * [Learn more about building conversations &rarr;](../conversations.md#build-a-conversation)
     * @param message A message that will be used as the prompt
     * @param handlers One or more handler functions defining possible conditional actions based on the response to the question
     * @param key Name of variable to store response in.
     * @param thread_name Name of thread to which message will be added
     */
    addQuestion(message: Partial<BotkitMessageTemplate> | string, handlers: BotkitConvoTrigger | BotkitConvoTrigger[], key: {
        key: string;
    } | string | null, thread_name: string): BotkitConversation;
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
    before(thread_name: string, handler: (convo: BotkitDialogWrapper, bot: BotWorker) => Promise<any>): void;
    /**
     * This private method is called before a thread begins, and causes any bound handler functions to be executed.
     * @param thread_name the thread about to begin
     * @param dc the current DialogContext
     * @param step the current step object
     */
    private runBefore;
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
    after(handler: (results: any, bot: BotWorker) => void): void;
    /**
     * This private method is called at the end of the conversation, and causes any bound handler functions to be executed.
     * @param context the current dialog context
     * @param results an object containing the final results of the dialog
     */
    private runAfter;
    /**
     * Bind a function to run whenever a user answers a specific question.  Can be used to validate input and take conditional actions.
     *
     * ```javascript
     * convo.ask('What is your name?', [], 'name');
     * convo.onChange('name', async(response, convo, bot) {
     *
     *  // user changed their name!
     *  // do something...
     *
     * });
     * ```
     * @param variable name of the variable to watch for changes
     * @param handler a handler function that will fire whenever a user's response is used to change the value of the watched variable
     */
    onChange(variable: string, handler: (response: any, convo: any, bot: any) => Promise<any>): void;
    /**
     * This private method is responsible for firing any bound onChange handlers when a variable changes
     * @param variable the name of the variable that is changing
     * @param value the new value of the variable
     * @param dc the current DialogContext
     * @param step the current step object
     */
    private runOnChange;
    /**
     * Called automatically when a dialog begins. Do not call this directly!
     * @ignore
     * @param dc the current DialogContext
     * @param options an object containing initialization parameters passed to the dialog. may include `thread` which will cause the dialog to begin with that thread instead of the `default` thread.
     */
    beginDialog(dc: DialogContext, options: any): Promise<any>;
    /**
     * Called automatically when an already active dialog is continued. Do not call this directly!
     * @ignore
     * @param dc the current DialogContext
     */
    continueDialog(dc: DialogContext): Promise<any>;
    /**
     * Called automatically when a dialog moves forward a step. Do not call this directly!
     * @ignore
     * @param dc The current DialogContext
     * @param reason Reason for resuming the dialog
     * @param result Result of previous step
     */
    resumeDialog(dc: any, reason: any, result: any): Promise<any>;
    /**
     * Called automatically to process the turn, interpret the script, and take any necessary actions based on that script. Do not call this directly!
     * @ignore
     * @param dc The current dialog context
     * @param step The current step object
     */
    private onStep;
    /**
     * Run a dialog step, based on the index and thread_name passed in.
     * @param dc The current DialogContext
     * @param index The index of the current step
     * @param thread_name The name of the current thread
     * @param reason The reason given for running this step
     * @param result The result of the previous turn if any
     */
    private runStep;
    /**
     * Automatically called when the the dialog ends and causes any handlers bound using `after()` to fire. Do not call this directly!
     * @ignore
     * @param dc The current DialogContext
     * @param value The final value collected by the dialog.
     */
    end(dc: DialogContext): Promise<DialogTurnStatus>;
    /**
     * Translates a line from the dialog script into an Activity. Responsible for doing token replacement.
     * @param line a message template from the script
     * @param vars an object containing key/value pairs used to do token replacement on fields in the message template
     */
    private makeOutgoing;
    /**
     * Responsible for doing token replacements recursively in attachments and other multi-field properties of the message.
     * @param attachments some object or array containing values for which token replacements should be made.
     * @param vars an object defining key/value pairs used for the token replacements
     */
    private parseTemplatesRecursive;
    /**
     * Handle the scripted "gotothread" action - requires an additional call to runStep.
     * @param thread The name of the thread to jump to
     * @param dc The current DialogContext
     * @param step The current step object
     */
    private gotoThreadAction;
    /**
     * Accepts a Botkit script action, and performs that action
     * @param path A conditional path in the form {action: 'some action', handler?: some handler function, maybe_other_fields}
     * @param dc The current DialogContext
     * @param step The current stpe object
     */
    private handleAction;
}
export {};
