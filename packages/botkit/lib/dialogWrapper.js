"use strict";
/**
 * @module botkit
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
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
 * This class is used to provide easy access to common actions taken on active BotkitConversation instances.
 * These objects are passed into handlers bound to BotkitConversations using .before .onChange and conditional handler functions passed to .ask and .addQuestion
 * Grants access to convo.vars convo.gotoThread() convo.setVar() and convo.repeat().
 */
class BotkitDialogWrapper {
    constructor(dc, step) {
        this.dc = dc;
        this.step = step;
        this.vars = this.step.values;
    }
    /**
     * Jump immediately to the first message in a different thread.
     * @param thread Name of a thread
     */
    gotoThread(thread) {
        return __awaiter(this, void 0, void 0, function* () {
            this.step.index = 0;
            this.step.thread = thread;
        });
    }
    /**
     * Repeat the last message sent on the next turn.
     */
    repeat() {
        return __awaiter(this, void 0, void 0, function* () {
            // move back one step next turn the bot will repeat with the last message sent.
            this.step.index--;
        });
    }
    /**
     * Set the value of a variable that will be available to messages in the conversation.
     * Equivalent to convo.vars.key = val;
     * Results in {{vars.key}} being replaced with the value in val.
     * @param key the name of the variable
     * @param val the value for the variable
     */
    setVar(key, val) {
        this.vars[key] = val;
    }
}
exports.BotkitDialogWrapper = BotkitDialogWrapper;
//# sourceMappingURL=dialogWrapper.js.map