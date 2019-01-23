"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_1 = require("botbuilder");
const botbuilder_dialogs_1 = require("botbuilder-dialogs");
const debug = require('debug')('botkit:conversation');
const mustache = require("mustache");
class BotkitConversation extends botbuilder_dialogs_1.Dialog {
    constructor(dialogId) {
        super(dialogId);
        this._beforeHooks = {};
        this._afterHooks = [];
        this._changeHooks = {};
        this.script = {};
        return this;
    }
    say(message) {
        this.addMessage(message, 'default');
    }
    addMessage(message, thread_name) {
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
    }
    ask(message, handlers, options) {
        this.addQuestion(message, handlers, options, 'default');
    }
    addQuestion(message, handlers, options, thread_name) {
        if (!thread_name) {
            thread_name = 'default';
        }
        if (!this.script[thread_name]) {
            this.script[thread_name] = [];
        }
        if (typeof (message) === 'string') {
            message = { text: [message] };
        }
        message.collect = {
            key: options.key
        };
        if (Array.isArray(handlers)) {
            message.collect.options = handlers;
        }
        else if (typeof (handlers) === 'function') {
            message.collect.options = [
                {
                    default: true,
                    handler: handlers
                }
            ];
        }
        // ensure all options have a type field
        message.collect.options.forEach((o) => { if (!o.type) {
            o.type = 'string';
        } });
        this.script[thread_name].push(message);
    }
    before(thread_name, handler) {
        if (!this._beforeHooks[thread_name]) {
            this._beforeHooks[thread_name] = [];
        }
        this._beforeHooks[thread_name].push(handler);
    }
    runBefore(thread_name, dc, step) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log('Run hooks before ', thread_name);
            // let convo = new BotkitConvo(dc, step);
            if (this._beforeHooks[thread_name]) {
                for (let h = 0; h < this._beforeHooks[thread_name].length; h++) {
                    let handler = this._beforeHooks[thread_name][h];
                    yield handler.call(this, dc, step);
                    // await handler.call(this, d);
                }
            }
        });
    }
    after(handler) {
        this._afterHooks.push(handler);
    }
    runAfter(context, results) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._afterHooks.length) {
                for (let h = 0; h < this._afterHooks.length; h++) {
                    let handler = this._afterHooks[h];
                    // await handler.call(this, results);
                    yield handler.call(this, context, results);
                }
            }
        });
    }
    onChange(variable, handler) {
        if (!this._changeHooks[variable]) {
            this._changeHooks[variable] = [];
        }
        this._changeHooks[variable].push(handler);
    }
    runOnChange(variable, value, dc, step) {
        return __awaiter(this, void 0, void 0, function* () {
            // let convo = new BotkitConvo(dc, step);
            if (this._changeHooks[variable] && this._changeHooks[variable].length) {
                for (let h = 0; h < this._changeHooks[variable].length; h++) {
                    let handler = this._changeHooks[variable][h];
                    // await handler.call(this, value, convo);
                    yield handler.call(this, value, dc, step);
                }
            }
        });
    }
    beginDialog(dc, options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Initialize the state
            const state = dc.activeDialog.state;
            state.options = options || {};
            // console.log('BEGIN A DIALOG, SET VALUES TO OPTIONS', options);
            state.values = Object.assign({}, options);
            // Add a prompt used for question turns
            if (!this._prompt) {
                this._prompt = this.id + '_default_prompt';
                dc.dialogs.add(new botbuilder_dialogs_1.TextPrompt(this._prompt));
            }
            // Run the first step
            return yield this.runStep(dc, 0, 'default', botbuilder_dialogs_1.DialogReason.beginCalled);
        });
    }
    continueDialog(dc) {
        return __awaiter(this, void 0, void 0, function* () {
            // Don't do anything for non-message activities
            if (dc.context.activity.type !== botbuilder_1.ActivityTypes.Message) {
                return botbuilder_dialogs_1.Dialog.EndOfTurn;
            }
            // Run next step with the message text as the result.
            return yield this.resumeDialog(dc, botbuilder_dialogs_1.DialogReason.continueCalled, dc.context.activity.text);
        });
    }
    resumeDialog(dc, reason, result) {
        return __awaiter(this, void 0, void 0, function* () {
            // Increment step index and run step
            const state = dc.activeDialog.state;
            return yield this.runStep(dc, state.stepIndex + 1, state.thread, reason, result);
        });
    }
    onStep(dc, step) {
        return __awaiter(this, void 0, void 0, function* () {
            // Let's interpret the current line of the script.
            const thread = this.script[step.thread];
            // this.script.script.filter(function(thread) {
            //     return thread.topic === step.thread;
            // })[0];
            var line = thread[step.index];
            var previous = (step.index >= 1) ? thread[step.index - 1] : null;
            // Capture the previous step value if there previous line included a prompt
            if (step.result && previous && previous.collect) {
                if (previous.collect.key) {
                    // capture before values
                    let index = step.index;
                    let thread_name = step.thread;
                    // run onChange handlers
                    step.values[previous.collect.key] = step.result;
                    yield this.runOnChange(previous.collect.key, step.result, dc, step);
                    // did we just change threads? if so, restart this turn
                    if (index != step.index || thread_name != step.thread) {
                        return yield this.runStep(dc, step.index, step.thread, botbuilder_dialogs_1.DialogReason.nextCalled, step.values);
                    }
                }
                // handle conditions of previous step
                if (previous.collect.options) {
                    var paths = previous.collect.options.filter((option) => { return !option.default === true; });
                    var default_path = previous.collect.options.filter((option) => { return option.default === true; })[0];
                    var path = null;
                    for (let p = 0; p < paths.length; p++) {
                        let condition = paths[p];
                        let test;
                        if (condition.type === 'string') {
                            test = new RegExp(condition.pattern, 'i');
                        }
                        else if (condition.type == 'regex') {
                            test = new RegExp(condition.pattern, 'i');
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
                        var res = yield this.handleAction(path, dc, step);
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
                    return yield dc.prompt(this._prompt, this.makeOutgoing(line, step.values)); // todo: pick randomly
                }
                catch (err) {
                    console.error(err);
                    const res = yield dc.context.sendActivity(`Failed to start prompt ${line.prompt.id}`);
                    return yield step.next();
                }
                // If there's nothing but text, send it!
                // This could be extended to include cards and other activity attributes.
            }
            else {
                if (line.text) {
                    yield dc.context.sendActivity(this.makeOutgoing(line, step.values)); // todo: update to pick randomly from options
                }
                if (line.action) {
                    var res = yield this.handleAction(line, dc, step);
                    if (res !== false) {
                        return res;
                    }
                }
                return yield step.next();
            }
        });
    }
    runStep(dc, index, thread_name, reason, result) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log('CURRENT POS', thread_name, index);
            // Let's interpret the current line of the script.
            // const thread = this.script.script.filter(function(thread) {
            //     return thread.topic === thread_name;
            // })[0]; // todo: protect against not found
            const thread = this.script[thread_name];
            if (index < thread.length) {
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
                    next: (stepResult) => __awaiter(this, void 0, void 0, function* () {
                        if (nextCalled) {
                            throw new Error(`ScriptedStepContext.next(): method already called for dialog and step '${this.id}[${index}]'.`);
                        }
                        return yield this.resumeDialog(dc, botbuilder_dialogs_1.DialogReason.nextCalled, stepResult);
                    })
                };
                // did we just start a new thread?
                // if so, run the before stuff.
                if (index === 0 && previous_thread != thread_name) {
                    yield this.runBefore(step.thread, dc, step);
                    // did we just change threads? if so, restart
                    if (index != step.index || thread_name != step.thread) {
                        return yield this.runStep(dc, step.index, step.thread, botbuilder_dialogs_1.DialogReason.nextCalled, step.values);
                    }
                }
                // Execute step
                const res = yield this.onStep(dc, step);
                return res;
            }
            else {
                // End of script so just return to parent
                return yield dc.endDialog(result);
            }
        });
    }
    endDialog(context, instance, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.runAfter(context, instance.state.values);
        });
    }
    makeOutgoing(line, vars) {
        let outgoing;
        if (line.quick_replies) {
            outgoing = botbuilder_1.MessageFactory.suggestedActions(line.quick_replies.map((reply) => { return { type: botbuilder_1.ActionTypes.PostBack, title: reply.title, text: reply.payload, displayText: reply.title, value: reply.payload }; }), line.text[0]);
        }
        else {
            outgoing = botbuilder_1.MessageFactory.text(line.text[Math.floor(Math.random() * line.text.length)]);
        }
        // console.log('handling raw script line', JSON.stringify(line, null, 2));
        // handle slack attachments
        if (line.attachments) {
            outgoing.channelData = {
                attachments: line.attachments,
            };
        }
        // handle teams attachments
        if (line.platforms && line.platforms.teams) {
            if (line.platforms.teams.attachments) {
                outgoing.attachments = line.platforms.teams.attachments.map((a) => {
                    a.content = Object.assign({}, a);
                    a.contentType = 'application/vnd.microsoft.card.' + a.type;
                    return a;
                });
            }
        }
        if (outgoing.text) {
            outgoing.text = mustache.render(outgoing.text, { vars: vars });
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
    parseTemplatesRecursive(attachments, vars) {
        if (attachments && attachments.length) {
            for (let a = 0; a < attachments.length; a++) {
                for (let key in attachments[a]) {
                    if (typeof (attachments[a][key]) === 'string') {
                        attachments[a][key] = mustache.render(attachments[a][key], { vars: vars });
                    }
                    else {
                        attachments[a][key] = this.parseTemplatesRecursive(attachments[a][key], vars);
                    }
                }
            }
        }
        else {
            for (let x in attachments) {
                if (typeof (attachments[x]) === 'string') {
                    attachments[x] = mustache.render(attachments[x], { vars: vars });
                }
                else {
                    attachments[x] = this.parseTemplatesRecursive(attachments[x], vars);
                }
            }
        }
        return attachments;
    }
    gotoThread(thread, dc, step) {
        return __awaiter(this, void 0, void 0, function* () {
            step.thread = thread;
            step.index = 0;
        });
    }
    gotoThreadAction(thread, dc, step) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.gotoThread(thread, dc, step);
            // await this.runBefore(step.thread, dc, step);
            return yield this.runStep(dc, step.index, step.thread, botbuilder_dialogs_1.DialogReason.nextCalled, step.values);
        });
    }
    handleAction(path, dc, step) {
        return __awaiter(this, void 0, void 0, function* () {
            if (path.handler) {
                const index = step.index;
                const thread_name = step.thread;
                yield path.handler.call(this, step.result, dc, step);
                // did we just change threads? if so, restart this turn
                if (index != step.index || thread_name != step.thread) {
                    return yield this.runStep(dc, step.index, step.thread, botbuilder_dialogs_1.DialogReason.nextCalled, step.values);
                }
                return false;
            }
            switch (path.action) {
                case 'next':
                    break;
                case 'complete':
                    step.values._status = 'completed';
                    return yield dc.endDialog(step.result);
                    break;
                case 'stop':
                    step.values._status = 'canceled';
                    return yield dc.endDialog(step.result);
                    break;
                case 'timeout':
                    step.values._status = 'timeout';
                    return yield dc.endDialog(step.result);
                    break;
                case 'execute_script':
                    // todo figure out how to goto thread
                    // todo figure out how to pass in existing values
                    // todo figure out how to capture responses from sub-script?
                    return yield dc.beginDialog(path.execute.script, step.values);
                    break;
                case 'repeat':
                    return yield this.runStep(dc, step.index - 1, step.thread, botbuilder_dialogs_1.DialogReason.nextCalled);
                    break;
                case 'wait':
                    console.log('NOT SURE WHAT TO DO WITH THIS!!', path);
                    // do not advance to the next step!
                    break;
                default:
                    // default behavior for unknown action in botkit is to gotothread
                    // if (this.script.script.filter((thread) => { return thread.topic === path.action }).length) {
                    if (this.script[path.action]) {
                        return yield this.gotoThreadAction(path.action, dc, step);
                    }
                    else {
                        console.log('NOT SURE WHAT TO DO WITH THIS!!', path);
                        break;
                    }
            }
            return false;
        });
    }
}
exports.BotkitConversation = BotkitConversation;
//# sourceMappingURL=conversation.js.map