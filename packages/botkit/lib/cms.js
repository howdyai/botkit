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
const botbuilder_dialogs_botkit_cms_1 = require("botbuilder-dialogs-botkit-cms");
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
class BotkitCMS {
    constructor(controller, config) {
        this._controller = controller;
        this._controller.addDep('cms');
        this._config = config;
        // load the API accessor
        this._cms = new botbuilder_dialogs_botkit_cms_1.BotkitHelper(this._config);
        // pre-load all the scripts via the CMS api
        this._cms.loadAllScripts(controller.dialogSet).then(() => {
            debug('Dialogs loaded from Botkit CMS');
            controller.completeDep('cms');
        });
    }
    testTrigger(bot, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._cms.testTrigger(bot, message);
        });
    }
    before(script_name, thread_name, handler) {
        let dialog = this._controller.dialogSet.find(script_name);
        dialog.before(thread_name, (dc, step) => __awaiter(this, void 0, void 0, function* () {
            // spawn a bot instance so devs can use API or other stuff as necessary
            const bot = yield this._controller.spawn(dc);
            // create a convo controller object
            const convo = new BotkitDialogWrapper(dc, step);
            // finally, call the registered handler.
            handler.call(this, bot, convo);
        }));
    }
    onChange(script_name, variable_name, handler) {
        let dialog = this._controller.dialogSet.find(script_name);
        dialog.onChange(variable_name, (value, dc, step) => __awaiter(this, void 0, void 0, function* () {
            // spawn a bot instance so devs can use API or other stuff as necessary
            const bot = yield this._controller.spawn(dc);
            // create a convo controller object
            const convo = new BotkitDialogWrapper(dc, step);
            // finally, call the registered handler.
            handler.call(this, bot, convo, value);
        }));
    }
    // NOTE: currently this does not receive a dc, so can't call beginDialog from within an after handler
    after(script_name, handler) {
        let dialog = this._controller.dialogSet.find(script_name);
        dialog.after((context, results) => __awaiter(this, void 0, void 0, function* () {
            const bot = yield this._controller.spawn(context);
            handler.call(this, bot, results);
        }));
    }
}
exports.BotkitCMS = BotkitCMS;
//# sourceMappingURL=cms.js.map