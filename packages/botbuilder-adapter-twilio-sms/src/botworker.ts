/**
 * @module botbuilder-adapter-twilio-sms
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BotWorker } from 'botkit';
import * as Twilio from 'twilio';
import { ConversationAccount, ChannelAccount } from 'botbuilder';

/**
 * This is a specialized version of [Botkit's core BotWorker class](core.md#BotWorker) that includes additional methods for interacting with Twilio SMS.
 * It includes all functionality from the base class, as well as the extension methods below.
 *
 * When using the TwilioAdapter with Botkit, all `bot` objects passed to handler functions will include these extensions.
 */export class TwilioBotWorker extends BotWorker {
    /**
     * A copy of the Twilio API client.
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
    public async startConversationWithUser(userId: string): Promise<any> {
        return this.changeContext({
            channelId: 'twilio-sms',
            conversation: { id: userId } as ConversationAccount,
            bot: { id: this.controller.getConfig('twilio_number'), name: 'bot' },
            user: { id: userId } as ChannelAccount
        });
    }
}
