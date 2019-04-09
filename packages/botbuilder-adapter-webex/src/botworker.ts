import { BotWorker } from 'botkit';
import * as Ciscospark from 'ciscospark';

export class WebexBotWorker extends BotWorker {
    public api: Ciscospark;

    /**
     * Change the context of the _next_ message
     * Due to a quirk in the Webex API, we can't know the address of the DM until after sending the first message.
     * As a result, the internal tracking for this conversation can't be persisted properly.
     * USE WITH CAUTION while we try to sort this out.
     * @param userId user id of a webex teams user, like one from `message.user`
     */
    public async startPrivateConversation(userId: string): Promise<any> {
        // send a message with the toPersonId or toPersonEmail set
        // response will have the roomID
        return this.changeContext({
            from: { id: userId },
            conversation: { id: 'temp' }, // TODO: this is fake
            channelId: 'webex'
        });
    };


}