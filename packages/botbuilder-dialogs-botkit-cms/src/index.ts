import { ActivityTypes, TurnContext, MessageFactory, ActionTypes } from 'botbuilder';
import { Dialog, DialogContext, DialogInstance, DialogSet, DialogReason, TextPrompt, DialogTurnStatus } from 'botbuilder-dialogs';
import * as BotkitCMS from 'botkit-studio-sdk';
import * as mustache from  'mustache';

export interface BotkitDialogConfig {
    cms_uri: string;
    token: string;
}

export class BotkitHelper {
    private _config: BotkitDialogConfig;
    private cms: BotkitCMS;

    constructor(config: BotkitDialogConfig) {
        this._config = config;
        this.cms = new BotkitCMS({
            studio_command_uri: config.cms_uri,
            studio_token: config.token
        })
    }

    async loadAllScripts(dialogSet: DialogSet) {

        var scripts = await this.cms.getScripts();

        scripts.forEach((script)=> {
            let d = new BotkitDialog(script.command, this._config);
            d.script = script;
            dialogSet.add(d);
        });
    }

    async testTriggerDC(dc: DialogContext) {
        const command = await this.cms.evaluateTrigger(dc.context.activity.text);
        if (command.command) {
            return await dc.beginDialog(command.command);
        }
    }

    async testTrigger(bot, message) {
        const command = await this.cms.evaluateTrigger(message.text);
        if (command.command) {
            return await bot.beginDialog(command.command);
        }
    }


}

export class BotkitDialog<O extends object = {}> extends Dialog<O> {

    public script: any;
    private _config: BotkitDialogConfig;
    private _prompt: string;
    private _beforeHooks: {};
    private _afterHooks: { (context: TurnContext, results: any): void }[];
    private _changeHooks: {};

    constructor(dialogId: string, config: BotkitDialogConfig) {
        super(dialogId);

        this._config = config;

        this._beforeHooks = {};
        this._afterHooks = [];
        this._changeHooks = {};

        return this;

    }

    public before(thread_name, handler) {
        if (!this._beforeHooks[thread_name]) {
            this._beforeHooks[thread_name] = [];
        }

        this._beforeHooks[thread_name].push(handler);
    }

     private async runBefore(thread_name, dc, step) {
        // console.log('Run hooks before ', thread_name);
        // let convo = new BotkitConvo(dc, step);
        
        if (this._beforeHooks[thread_name]) {
            for (let h = 0; h < this._beforeHooks[thread_name].length; h++ ){
                let handler = this._beforeHooks[thread_name][h];
                await handler.call(this, dc, step);
                // await handler.call(this, d);
            }
        }
    }    
    
    public after(handler: (context: TurnContext, results: any) => void) {
        this._afterHooks.push(handler);
    }

    private async runAfter(context, results) {
        if (this._afterHooks.length) {
            for (let h = 0; h < this._afterHooks.length; h++ ){
                let handler = this._afterHooks[h];
                // await handler.call(this, results);
                await handler.call(this, context, results);
            }
        }
    }

    public onChange(variable, handler) {
        if (!this._changeHooks[variable]) {
            this._changeHooks[variable] = [];
        }

        this._changeHooks[variable].push(handler);
    }

    private async runOnChange(variable, value, dc, step) {
        // let convo = new BotkitConvo(dc, step);

        if (this._changeHooks[variable] && this._changeHooks[variable].length) {
            for (let h = 0; h < this._changeHooks[variable].length; h++ ){
                let handler = this._changeHooks[variable][h];
                // await handler.call(this, value, convo);
                await handler.call(this, value, dc, step);
            }
        }
    }

    async beginDialog(dc, options) {
        // Initialize the state
        const state = dc.activeDialog.state;
        state.options = options || {};
        // console.log('BEGIN A DIALOG, SET VALUES TO OPTIONS', options);
        state.values = {...options};

        if (!this.script) {
            // load script from API
            const cms = new BotkitCMS({
                studio_command_uri: this._config.cms_uri,
                studio_token: this._config.token
            });

            const script = await cms.getScript(this.id);
            if (script.command) {
                this.script = script;
            } else {
                throw new Error('No script found with name ' + this.id);
            }

        }

        // Add a prompt used for question turns
        if (!this._prompt) {
            this._prompt = this.id + '_default_prompt';
            dc.dialogs.add(new TextPrompt(this._prompt));
        }

        // Run the first step
        return await this.runStep(dc, 0, 'default', DialogReason.beginCalled);
    }

    async continueDialog(dc) {

        // Don't do anything for non-message activities
        if (dc.context.activity.type !== ActivityTypes.Message) {
            return Dialog.EndOfTurn;
        }

        // Run next step with the message text as the result.
        return await this.resumeDialog(dc, DialogReason.continueCalled, dc.context.activity.text);
    }

    async resumeDialog(dc, reason, result) {
        // Increment step index and run step
        const state = dc.activeDialog.state;

        return await this.runStep(dc, state.stepIndex + 1, state.thread, reason, result);
    }

    async onStep(dc, step) {

        // Let's interpret the current line of the script.
        const thread = this.script.script.filter(function(thread) {
            return thread.topic === step.thread;
        })[0];

        var line = thread.script[step.index];

        var previous = (step.index >= 1) ? thread.script[step.index - 1] : null;
        // Capture the previous step value if there previous line included a prompt
        if (step.result && previous && previous.collect) {
            if (previous.collect.key) {
                // capture before values
                let index = step.index;
                let thread_name = step.thread;

                // run onChange handlers
                step.values[previous.collect.key] = step.result;
                await this.runOnChange(previous.collect.key, step.result, dc, step);

                // did we just change threads? if so, restart this turn
                if (index != step.index || thread_name != step.thread) {
                    return await this.runStep(dc, step.index, step.thread, DialogReason.nextCalled, step.values);
                }

            }

            // handle conditions of previous step
            if (previous.collect.options) {
                var paths = previous.collect.options.filter((option) => { return !option.default===true });
                var default_path = previous.collect.options.filter((option) => { return option.default===true })[0];
                var path = null;

                for (let p = 0; p < paths.length; p++) {
                    let condition = paths[p];
                    let test;
                    if (condition.type==='string') {
                        test = new RegExp(condition.pattern,'i');
                    } else if (condition.type =='regex') {
                        test = new RegExp(condition.pattern,'i');
                    }

                    if (step.result.match(test)) {
                        path = condition;
                        break;
                    }
                }

                // take default path if one is set
                if (!path) {
                    path = default_path;
                }

                if (path) {
                    var res = await this.handleAction(path, dc, step);
                    if (res !== false) {
                        return res;
                    }
                }
            }
        }

        // If a prompt is defined in the script, use dc.prompt to call it.
        // This prompt must be a valid dialog defined somewhere in your code!
        if (line.collect) {
            try {
                return await dc.prompt(this._prompt, this.makeOutgoing(line, step.values)); // todo: pick randomly
            } catch (err) {
                console.error(err);
                const res = await dc.context.sendActivity(`Failed to start prompt ${ line.prompt.id }`);
                return await step.next();
            }
        // If there's nothing but text, send it!
        // This could be extended to include cards and other activity attributes.
        } else {
            if (line.text) {
                await dc.context.sendActivity(this.makeOutgoing(line, step.values)); // todo: update to pick randomly from options
            }

            if (line.action) {

                var res = await this.handleAction(line, dc, step);
                if (res !== false) {
                    return res;
                }
            }

            return await step.next();
        }
    }

    async runStep(dc, index, thread_name, reason, result?) {

        // console.log('CURRENT POS', thread_name, index);

        // Let's interpret the current line of the script.
        const thread = this.script.script.filter(function(thread) {
            return thread.topic === thread_name;
        })[0]; // todo: protect against not found


        if (index < thread.script.length) {
            // Update the step index
            const state = dc.activeDialog.state;
            state.stepIndex = index;
            const previous_thread = state.thread;
            state.thread = thread_name;

            // Create step context
            const nextCalled = false;
            const step = {
                index: index,
                thread: thread_name,
                options: state.options,
                reason: reason,
                result: result,
                values: state.values,
                next: async (stepResult) => {
                    if (nextCalled) {
                        throw new Error(`ScriptedStepContext.next(): method already called for dialog and step '${ this.id }[${ index }]'.`);
                    }

                    return await this.resumeDialog(dc, DialogReason.nextCalled, stepResult);
                }
            };

            // did we just start a new thread?
            // if so, run the before stuff.
            if (index === 0 && previous_thread != thread_name) {
                await this.runBefore(step.thread, dc, step);

                // did we just change threads? if so, restart
                if (index != step.index || thread_name != step.thread) {
                    return await this.runStep(dc, step.index, step.thread, DialogReason.nextCalled, step.values);
                }
            }

            // Execute step
            const res = await this.onStep(dc, step);

            return res;
        } else {

            // End of script so just return to parent
            return await dc.endDialog(result);
        }
    }

    async endDialog(context: TurnContext, instance: DialogInstance, reason: DialogReason) {
        return await this.runAfter(context, instance.state.values);
    }

    private makeOutgoing(line, vars) {
        let outgoing;
        if (line.quick_replies) {
            outgoing = MessageFactory.suggestedActions(line.quick_replies.map((reply) => { return { type:  ActionTypes.PostBack, title: reply.title, text: reply.payload, displayText: reply.title, value: reply.payload}; }), line.text[0]);
        } else {
            outgoing = MessageFactory.text(line.text[Math.floor(Math.random()*line.text.length)]);
        }

        // console.log('handling raw script line', JSON.stringify(line, null, 2));

        // handle slack attachments
        if (line.attachments) {
            outgoing.channelData = {
                attachments: line.attachments,
            }
        }

        // handle teams attachments
        if (line.platforms && line.platforms.teams) {
            if (line.platforms.teams.attachments) {
                outgoing.attachments = line.platforms.teams.attachments.map((a) => {
                    a.content = {...a};
                    a.contentType = 'application/vnd.microsoft.card.' + a.type;
                    return a;
                });
            }
        }

        if (outgoing.text) {
            outgoing.text = mustache.render(outgoing.text, {vars: vars});
        }
        if (outgoing.attachments) {
            outgoing.attachments = this.parseTemplatesRecursive(outgoing.attachments, vars);
        }
        if (outgoing.channelData && outgoing.channelData.attachments) {
            outgoing.channelData.attachments = this.parseTemplatesRecursive(outgoing.channelData.attachments, vars);
        }
        if (outgoing.channelData && outgoing.channelData.attachment) {
            outgoing.channelData.attachment = this.parseTemplatesRecursive(outgoing.channelData.attachment, vars);
        }

        // console.log('formatted outgoing activity', JSON.stringify(outgoing, null, 2));

        return outgoing;
    }


    private parseTemplatesRecursive(attachments, vars) {

        if (attachments && attachments.length) {
            for (let a = 0; a < attachments.length; a++) {
                for (let key in attachments[a]) {
                    if (typeof(attachments[a][key]) === 'string') {
                        attachments[a][key] =  mustache.render(attachments[a][key], {vars: vars});
                    } else {
                        attachments[a][key] = this.parseTemplatesRecursive(attachments[a][key], vars);
                    }
                }
            }
        } else {
            for (let x in attachments) {
                if (typeof(attachments[x]) === 'string') {
                    attachments[x] = mustache.render(attachments[x], {vars: vars});
                } else {
                    attachments[x] = this.parseTemplatesRecursive(attachments[x], vars);
                }
            }
        }


        return attachments;
    }

    public async gotoThread(thread, dc, step) {
        step.thread = thread;
        step.index = 0;
    }

    private async gotoThreadAction(thread, dc, step) {
        await this.gotoThread(thread, dc, step);
        // await this.runBefore(step.thread, dc, step);
        return await this.runStep(dc, step.index, step.thread, DialogReason.nextCalled, step.values);
    }

    private async handleAction(path, dc, step) {

        switch (path.action) {
            case 'next':
                break;
            case 'complete':
                step.values._status = 'completed';
                return await dc.endDialog(step.result);
                break;
            case 'stop':
                step.values._status = 'canceled';
                return await dc.endDialog(step.result);
                break;
            case 'timeout':
                step.values._status = 'timeout';
                return await dc.endDialog(step.result);
                break;
            case 'execute_script':
                // todo figure out how to goto thread
                // todo figure out how to pass in existing values
                // todo figure out how to capture responses from sub-script?
                return await dc.beginDialog(path.execute.script, step.values);
                break;
            case 'repeat':
                return await this.runStep(dc, step.index - 1, step.thread, DialogReason.nextCalled);
                break;
            case 'wait':
                console.log('NOT SURE WHAT TO DO WITH THIS!!', path);
                // do not advance to the next step!
                break;
            default:
                // default behavior for unknown action in botkit is to gotothread
                if (this.script.script.filter((thread) => { return thread.topic === path.action }).length) {
                   return await this.gotoThreadAction(path.action, dc, step);
                } else {
                    console.log('NOT SURE WHAT TO DO WITH THIS!!', path);
                    break;
                }
        }

        return false;
    }
}
