/**
 * @module botbuilder-adapter-facebook
 */
import { BotWorker } from 'botkit';
import * as Twilio from 'twilio';

/**
 * Specialized version of the BotWorker class that includes additional methods for interacting with Twilio.
 * When using the TwilioAdapter with Botkit, all `bot` objects will be of this type.
 */
export class TwilioBotWorker extends BotWorker {
    /**
     * A copy of the Twilio API client
     */
    public api: Twilio.Twilio; // Twilio api

    /**
     * Start a conversation with a given user identified by their phone number. Useful for sending pro-active messages:
     *
     * ```javascript
     * let bot = await controller.spawn();
     * await bot.startConversationWithUser(MY_PHONE_NUMBER);
     * await bot.send('An important update!');
     * ```
     *
     * @param userId A phone number in the form +1XXXYYYZZZZ
     */
    public async startConversationWithUser(userId: string): Promise<void> {
        return this.changeContext({
            channelId: 'twilio-sms',
            // @ts-ignore
            conversation: { id: userId },
            bot: { id: this.controller.getConfig('twilio_number'), name: 'bot' },
            // @ts-ignore
            user: { id: userId }
        });
    }
}
