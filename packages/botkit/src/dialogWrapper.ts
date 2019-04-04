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
    public vars: {
        [key: string]: any;
    }


    constructor(dc: DialogContext, step: BotkitConversationStep) {
        this.dc = dc;
        this.step = step;
        this.vars = this.step.values;
    }

    /**
     * Jump immediately to the first message in a different thread.
     * @param thread Name of a thread
     */
    public async gotoThread(thread: string) {
        this.step.index = 0;
        this.step.thread = thread;
    }

    /**
     * Repeat the last message sent on the next turn.
     */
    public async repeat() {
        // move back one step next turn the bot will repeat with the last message sent.
        this.step.index--;
    }

    /**
     * Set the value of a variable that will be available to messages in the conversation.
     * Equivalent to convo.vars.key = val;
     * Results in {{vars.key}} being replaced with the value in val.
     * @param key the name of the variable
     * @param val the value for the variable
     */
    public setVar(key, val) {
        this.vars[key] = val;
    }

    // TODO: Add other control mechanisms
    // Botkit currently has things convo.repeat, convo.stop, etc
    
}
