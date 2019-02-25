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
/**
 * @module botkit
 */
const _1 = require(".");
const BotkitCMS = require("botkit-studio-sdk");
const debug = require('debug')('botkit:cms');
class BotkitDialogWrapper {
    constructor(dc, step) {
        this.dc = dc;
        this.step = step;
        this.vars = this.step.values;
    }
    gotoThread(thread) {
        return __awaiter(this, void 0, void 0, function* () {
            this.step.index = 0;
            this.step.thread = thread;
        });
    }
}
exports.BotkitDialogWrapper = BotkitDialogWrapper;
class BotkitCMSHelper {
    constructor(controller, config) {
        this._controller = controller;
        this._controller.addDep('cms');
        this._config = config;
        // load the API accessor
        this._cms = new BotkitCMS({
            studio_command_uri: this._config.cms_uri,
            studio_token: this._config.token
        });
        // pre-load all the scripts via the CMS api
        this.loadAllScripts(controller.dialogSet).then(() => {
            debug('Dialogs loaded from Botkit CMS');
            controller.completeDep('cms');
        });
    }
    loadAllScripts(dialogSet) {
        return __awaiter(this, void 0, void 0, function* () {
            var scripts = yield this._cms.getScripts();
            scripts.forEach((script) => {
                // map threads from array to object
                const threads = {};
                script.script.forEach((thread) => {
                    threads[thread.topic] = thread.script;
                });
                let d = new _1.BotkitConversation(script.command, this._controller);
                d.script = threads;
                dialogSet.add(d);
            });
        });
    }
    testTrigger(bot, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = yield this._cms.evaluateTrigger(message.text);
            if (command.command) {
                return yield bot.beginDialog(command.command);
            }
            return false;
        });
    }
    before(script_name, thread_name, handler) {
        let dialog = this._controller.dialogSet.find(script_name);
        if (dialog) {
            dialog.before(thread_name, handler);
        }
        else {
            throw new Error('Could not find dialog: ' + script_name);
        }
    }
    onChange(script_name, variable_name, handler) {
        let dialog = this._controller.dialogSet.find(script_name);
        if (dialog) {
            dialog.onChange(variable_name, handler);
        }
        else {
            throw new Error('Could not find dialog: ' + script_name);
        }
    }
    // NOTE: currently this does not receive a dc, so can't call beginDialog from within an after handler
    after(script_name, handler) {
        let dialog = this._controller.dialogSet.find(script_name);
        if (dialog) {
            dialog.after(handler);
        }
        else {
            throw new Error('Could not find dialog: ' + script_name);
        }
    }
}
exports.BotkitCMSHelper = BotkitCMSHelper;
//# sourceMappingURL=cms.js.map