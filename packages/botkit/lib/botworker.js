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
const debug = require('debug')('botkit:worker');
class BotWorker {
    constructor(controller, config) {
        this._controller = controller;
        this._config = Object.assign({}, config);
    }
    /* Return a value out of the configuration */
    getConfig(key) {
        if (key) {
            return this._config[key];
        }
        else {
            return this._config;
        }
    }
    /* Send a message using information passed in during spawning */
    say(message) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const activity = this.ensureMessageFormat(message);
                this._controller.middleware.send.run(this, activity, (err, bot, activity) => {
                    // NOTE: This calls the BotBuilder middleware again...
                    this._controller.adapter.continueConversation(this._config.reference, (outgoing_context) => __awaiter(this, void 0, void 0, function* () {
                        resolve(yield outgoing_context.sendActivity(activity));
                    }));
                });
            });
        });
    }
    ;
    /* Send a reply to an inbound message, using information collected from that inbound message */
    reply(src, resp) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const activity = this.ensureMessageFormat(resp);
                // get conversation reference from src
                const reference = botbuilder_1.TurnContext.getConversationReference(src.incoming_message);
                // use the new reference to send the outgoing message
                this._controller.middleware.send.run(this, activity, (err, bot, activity) => {
                    // NOTE: This calls the BotBuilder middleware again...
                    this._controller.adapter.continueConversation(reference, (outgoing_context) => __awaiter(this, void 0, void 0, function* () {
                        resolve(yield outgoing_context.sendActivity(activity));
                    }));
                });
            });
        });
    }
    /* Begin a BotBuilder dialog */
    beginDialog(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._config.dialogContext) {
                yield this._config.dialogContext.beginDialog(id, options);
                // make sure we save the state change caused by the dialog.
                // this may also get saved again at end of turn
                yield this._controller.saveState(this);
            }
            else {
                throw new Error('Call to beginDialog on a bot that did not receive a dialogContext during spawn');
            }
        });
    }
    changeContext(reference) {
        return __awaiter(this, void 0, void 0, function* () {
            // change context of outbound activities to use this new address
            this._config.reference = reference;
            // Create an activity using this reference
            const activity = botbuilder_1.TurnContext.applyConversationReference({ type: 'message' }, reference, true);
            // create a turn context
            const turnContext = new botbuilder_1.TurnContext(this._controller.adapter, activity);
            // create a new dialogContext so beginDialog works.
            const dialogContext = yield this._controller.dialogSet.createContext(turnContext);
            this._config.context = turnContext;
            this._config.dialogContext = dialogContext;
            this._config.activity = activity;
            return this;
        });
    }
    ensureMessageFormat(msg) {
        if (typeof (msg) === 'string') {
            msg = {
                text: msg
            };
        }
        return msg;
    }
    /*
     * set the http response status for this turn
     * @param status (number) a valid http status code like 200 202 301 500 etc
     */
    httpStatus(status) {
        this.getConfig('context').turnState.set('httpStatus', status);
    }
    /*
     * set the http response body for this turn
     * @param body (any) a value that will be returned as the http response body
     */
    httpBody(body) {
        this.getConfig('context').turnState.set('httpBody', body);
    }
}
exports.BotWorker = BotWorker;
//# sourceMappingURL=botworker.js.map