/**
 * @module botbuilder-adapter-hangouts
 */
import { BotWorker, BotkitMessage } from 'botkit';

/**
 * Specialized version of the BotWorker class that includes additional methods for interacting with Google Hangouts.
 * When using the HangoutsAdapter with Botkit, all `bot` objects will be of this type.
 */
export class HangoutsBotWorker extends BotWorker {
    /**
     * Update an existing message with new content.
     * 
     * ```javascript
     * // send a reply, capture the results
     * let sent = await bot.reply(message,'this is my original reply...');
     * 
     * // update the sent message using the sent.id field
     * await bot.updateMessage({
     *      id: sent.id,
     *      text: 'this is an update!',
     * })
     * ```
     * 
     * @param update An object in the form `{id: <id of message to update>, text: <new text>, card: <array of card objects>}`
     */
    public async updateMessage(update: Partial<BotkitMessage>): Promise<any> {
        return this.controller.adapter.updateActivity(
            this.getConfig('context'), // not currently used
            {
                id: update.id,
                text: update.text,
                channelData: {
                    cards: update.cards
                }
            }
        );
    }

    /**
     * Delete an existing message.
     * 
     * ```javascript
     * // send a reply, capture the results
     * let sent = await bot.reply(message,'this is my original reply...');
     * 
     * // delete the sent message using the sent.id field
     * await bot.deleteMessage(sent);
     * ```
     * 
     * @param update An object in the form of `{id: <id of message to delete>}`
     */
    public async deleteMessage(update: Partial<BotkitMessage>): Promise<any> {
        return this.controller.adapter.deleteActivity(
            this.getConfig('context'), // not currently used
            {
                activityId: update.id
            }
        );
    }

    /**
     * Reply to a card_click event with a new message.
     * 
     * When a user clicks a button contained in a card attachment, a `card_clicked` event will be emitted.
     * In order to reply to the incoming event with a new message (rather than replacing the original card), use this method!
     * 
     * ```javascript
     * controller.on('card_clicked', async(bot, message) => {
     *      // check message.action.actionMethodName to see what button was clicked...
     *      await bot.replyWithNew(message,'Reply to button click!');
     * })
     * ```
     * 
     * @param src An incoming event object representing a card_clicked event
     * @param resp A reply message containing text and/or cards
     */
    public async replyWithNew(src: any, resp: Partial<BotkitMessage>): Promise<any> {
        resp = this.ensureMessageFormat(resp);
        if (src.type === 'card_clicked') {
            this.httpBody({
                actionResponse: {
                    type: 'NEW_MESSAGE'
                },
                text: resp.text,
                cards: resp.channelData.cards
            });
        } else {
            console.error('replyWithNew can only be used with card-click events');
        }
    }

    /**
     * Reply to a card_click event with an update to the original message.
     * 
     * When a user clicks a button contained in a card attachment, a `card_clicked` event will be emitted.
     * In order to reply to the incoming event by replacing the original message, use this method!
     * 
     * ```javascript
     * controller.on('card_clicked', async(bot, message) => {
     *      // check message.action.actionMethodName to see what button was clicked...
     *      await bot.replyWithUpdate(message,'Reply to button click!');
     * })
     * ```
     * 
     * @param src An incoming event object representing a card_clicked event
     * @param resp A reply message containing text and/or cards
     */
    public async replyWithUpdate(src: any, resp: Partial<BotkitMessage>): Promise<any> {
        resp = this.ensureMessageFormat(resp);
        if (src.type === 'card_clicked') {
            this.httpBody({
                actionResponse: {
                    type: 'UPDATE_MESSAGE'
                },
                text: resp.text,
                cards: resp.cards
            });
        } else {
            console.error('replyWithUpdate can only be used with card-click events');
        }
    }

    /**
     * Reply to an incoming message in a brand new thread.  Works for a single message reply - if multiple replies or replying with a dialog is necessary, use [startConversationInThread](#startconversationinthread).
     * 
     * ```javascript
     * controller.hears('thread','message', async(bot, message) =>{
     *      await bot.replyInThread(message,'This will appear in a new thread.');
     * });
     * ```
     * @param src An incoming message or event object
     * @param resp A reply message containing text and/or cards
     */
    public async replyInThread(src, resp): Promise<any> {
        // ensure that the threadKey is null.
        // this will cause a new thread to be created.
        delete src.incoming_message.conversation.thread;

        // generate a random thread key id
        src.incoming_message.conversation.threadKey = 'botkit/' + Math.random() * 100000 + '/' + Math.random() * 100000;

        return this.reply(src, resp);
    }


    /**
     * Switch the bot's active context to a new thread.
     * Use this to change the location of a bot's responses or calls to beginDialog into a new conversation thread (rather than continuing in the same thread as the originating message)
     * 
     * ```javascript
     * controller.hears('new thread', 'message', async(bot, message) => {
     * 
     *      // change to a new thread
     *      await bot.startConversationInThread(message.channel, message.user);
     * 
     *      // begin a dialog in the new thread
     *      await bot.beginDialog('foo');
     * 
     * });
     * ```
     * 
     * @param spaceName The name of the main space - usually `message.channel`
     * @param userId The id of the user conducting the conversation - usually `message.user`
     * @param threadKey An optional key definining the thread - if one is not provided, a random one is generated.
     */
    public async startConversationInThread(spaceName: string, userId: string, threadKey?: string): Promise<any> {
        return this.changeContext({
            conversation: {
                id: spaceName,
                // @ts-ignore we need to extend this object with additional fields
                threadKey: threadKey || 'botkit/' + Math.random() * 100000 + '/' + Math.random() * 100000
            },
            user: { id: userId, name: null },
            channelId: 'googlehangouts'
        });
    }
}
