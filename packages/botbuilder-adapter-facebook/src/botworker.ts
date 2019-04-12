/**
 * @module botbuilder-adapter-facebook
 */
import { Botkit, BotWorker } from 'botkit';
import { FacebookAPI } from './facebook_api';

/**
 * Specialized version of the BotWorker class that includes additional methods for interacting with Facebook.
 * When using the FacebookAdapter with Botkit, all `bot` objects will be of this type.
 */
export class FacebookBotWorker extends BotWorker {
    /**
     * A copy of the FacebookAPI client giving access to `await res = bot.api.callAPI(path, method, parameters);`
     */
    public api: FacebookAPI;

    /**
     * Used internally by controller.spawn, creates a BotWorker instance that can send messages, replies, and make other API calls.
     *
     * The example below demonstrates spawning a bot for sending proactive messages to users:
     * ```javascript
     * let bot = await controller.spawn(FACEBOOK_PAGE_ID);
     * await bot.startConversationWithUser(FACEBOOK_USER_PSID);
     * await bot.say('Howdy human!');
     * ```
     * @param botkit The Botkit controller object responsible for spawning this bot worker
     * @param config Normally, a DialogContext object.  Can also be the ID of a Facebook page managed by this app.
     */
    public constructor(botkit: Botkit, config: any) {
        // allow a page id to be passed in
        if (typeof config === 'string') {
            const page_id = config;
            config = {
                // an activity is required to spawn the bot via the api
                activity: {
                    channelId: 'facebook',
                    recipient: {
                        id: page_id
                    }
                }
            };
        }

        super(botkit, config);
    }

    // TODO: Typing indicators

    public async startConversationWithUser(userId): Promise<void> {
        return this.changeContext({
            channelId: 'facebook',
            // @ts-ignore
            conversation: { id: userId },
            bot: this.getConfig('activity').recipient,
            // @ts-ignore
            user: { id: userId }
        });
    }
}
