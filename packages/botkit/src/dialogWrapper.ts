/**
 * @module botkit
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DialogContext } from 'botbuilder-dialogs';
import { BotkitConversationStep } from './conversation';

/**
 * This class is used to provide easy access to common actions taken on active BotkitConversation instances.
 * These objects are passed into handlers bound to BotkitConversations using .before .onChange and conditional handler functions passed to .ask and .addQuestion
 * Grants access to convo.vars convo.gotoThread() convo.setVar() and convo.repeat().
 */
export class BotkitDialogWrapper {
    private dc: DialogContext;
    private step: BotkitConversationStep;
    /**
     * An object containing variables and user responses from this conversation.
     */
    public vars: {
        [key: string]: any;
    }

    public constructor(dc: DialogContext, step: BotkitConversationStep) {
        this.dc = dc;
        this.step = step;
        this.vars = this.step.values;
    }

    /**
     * Jump immediately to the first message in a different thread.
     * @param thread Name of a thread
     */
    public async gotoThread(thread: string): Promise<void> {
        this.step.index = 0;
        this.step.thread = thread;
    }

    /**
     * Repeat the last message sent on the next turn.
     */
    public async repeat(): Promise<void> {
        // move back one step next turn the bot will repeat with the last message sent.
        this.step.index--;
    }

    /**
     * Stop the dialog.
     */
    public async stop(): Promise<void> {
        // set this to 1 bigger than the total length of the thread.
        this.step.index = this.step.threadLength + 1;
    }

    /**
     * Set the value of a variable that will be available to messages in the conversation.
     * Equivalent to convo.vars.key = val;
     * Results in {{vars.key}} being replaced with the value in val.
     * @param key the name of the variable
     * @param val the value for the variable
     */
    public setVar(key, val): void {
        this.vars[key] = val;
    }
}
