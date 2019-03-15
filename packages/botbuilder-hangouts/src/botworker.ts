import { BotWorker, BotkitMessage } from 'botkit';

export class HangoutsBotWorker extends BotWorker {

    constructor(botkit, config) {
        super(botkit, config);
    }

    /* 
     * Update an existing message with a new version
     * @param update An object containing {id, text, cards}
     */
    async updateMessage(update: Partial<BotkitMessage>) {
        return this.controller.adapter.updateActivity(
            this.getConfig('context'),
            {
                id: update.id,
                text: update.text,
                channelData: {
                    cards: update.cards,
                }
            }
        );
    }

    /* 
     * Delete an existing message
     * @param update An object containing {id} 
     */
    async deleteMessage(update: Partial<BotkitMessage>) {
        return this.controller.adapter.deleteActivity(
            this.getConfig('context'),
            {
                activityId: update.id,
            }
        );
    }

    /* 
     * Reply to a card_click event with a new message
     * @param src An incoming event object representing a card_clicked event
     * @param resp A reply message containing text and/or cards
     */
    async replyWithNew(src: any, resp: Partial<BotkitMessage>) {
        resp = this.ensureMessageFormat(resp);
        if (src.type === 'card_clicked') {
            this.httpBody({
                actionResponse: {
                    type: 'NEW_MESSAGE',
                },
                text: resp.text,
                cards: resp.channelData.cards,
            });
        } else {
            console.error('replyWithUpdate can only be used with card-click events');
        }

    }

    /* 
     * Reply to a card_click event by updating the original message
     * @param src An incoming event object representing a card_clicked event
     * @param resp A reply message containing text and/or cards
     */
    async replyWithUpdate(src: any, resp: Partial<BotkitMessage>) {
        resp = this.ensureMessageFormat(resp);
        if (src.type === 'card_clicked') {
            this.httpBody({
                actionResponse: {
                    type: 'UPDATE_MESSAGE',
                },
                text: resp.text,
                cards: resp.cards,
            });
        } else {
            console.error('replyWithUpdate can only be used with card-click events');
        }
    }


    /* 
     * Reply to an incoming message in a brand new thread.
     * @param src An incoming message or event object
     * @param resp A reply message containing text and/or cards
     */
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
                // @ts-ignore we need to extend this object with additional fields
                threadKey: threadKey || 'botkit/' + Math.random() * 100000 + '/' + Math.random() * 100000,
            },
            user: { id: userId, name: null },
            channelId: 'googlehangouts'
        });
    }

}