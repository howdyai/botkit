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
export declare class BotkitDialogWrapper {
    private dc;
    private step;
    /**
     * An object containing variables and user responses from this conversation.
     */
    vars: {
        [key: string]: any;
    };
    constructor(dc: DialogContext, step: BotkitConversationStep);
    /**
     * Jump immediately to the first message in a different thread.
     * @param thread Name of a thread
     */
    gotoThread(thread: string): Promise<void>;
    /**
     * Repeat the last message sent on the next turn.
     */
    repeat(): Promise<void>;
    /**
     * Set the value of a variable that will be available to messages in the conversation.
     * Equivalent to convo.vars.key = val;
     * Results in {{vars.key}} being replaced with the value in val.
     * @param key the name of the variable
     * @param val the value for the variable
     */
    setVar(key: any, val: any): void;
}
