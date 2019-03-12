import { BotWorker } from 'botkit';
import * as request from 'request';

export class HangoutsBotWorker extends BotWorker {

    constructor(botkit, config) {
        super(botkit, config);
    }

    // TODO: reply to cardclick new
    // TODO: reply to cardclick update
    // TODO: wrapper for .update and .delete

    // change context to thread/user
    async replyInThread(src, resp) {
        // ensure that the threadKey is null.
        // this will cause a new thread to be created.
        delete src.incoming_message.conversation.thread;
        src.incoming_message.conversation.threadKey = 'botkit/' + Math.random() * 100000 + '/' + Math.random() * 100000;

        return this.reply(src, resp);
    }

    async startConversationInThread(spaceName: string, userId: string, threadKey?: string): Promise<any> {
        return this.changeContext({
            conversation: {
                id: spaceName,
                threadKey: threadKey || 'botkit/' + Math.random() * 100000 + '/' + Math.random() * 100000,
            },
            user: { id: userId, name: null },
            channelId: 'googlehangouts'
        });
    }

}