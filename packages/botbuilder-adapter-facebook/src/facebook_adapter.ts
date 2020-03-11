/**
 * @module botbuilder-adapter-facebook
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity, ActivityTypes, BotAdapter, TurnContext, ConversationReference, ResourceResponse } from 'botbuilder';
import * as Debug from 'debug';
import { FacebookBotWorker } from './botworker';
import { FacebookAPI } from './facebook_api';
import * as crypto from 'crypto';
const debug = Debug('botkit:facebook');

/**
 * Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Facebook Messenger.
 */
export class FacebookAdapter extends BotAdapter {
    /**
     * Name used by Botkit plugin loader
     * @ignore
     */
    public name = 'Facebook Adapter';

    /**
     * Object containing one or more Botkit middlewares to bind automatically.
     * @ignore
     */
    public middlewares;

    /**
     * A customized BotWorker object that exposes additional utility methods.
     * @ignore
     */
    public botkit_worker = FacebookBotWorker;

    private options: FacebookAdapterOptions;

    /**
     * Create an adapter to handle incoming messages from Facebook and translate them into a standard format for processing by your bot.
     *
     * The Facebook Adapter can be used in 2 modes:
     * * bound to a single Facebook page
     * * multi-tenancy mode able to serve multiple pages
     *
     * To create an app bound to a single Facebook page, include that page's `access_token` in the options.
     *
     * To create an app that can be bound to multiple pages, include `getAccessTokenForPage` - a function in the form `async (pageId) => page_access_token`
     *
     * To use with Botkit:
     * ```javascript
     * const adapter = new FacebookAdapter({
     *      verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
     *      app_secret: process.env.FACEBOOK_APP_SECRET,
     *      access_token: process.env.FACEBOOK_ACCESS_TOKEN
     * });
     * const controller = new Botkit({
     *      adapter: adapter,
     *      // other options
     * });
     * ```
     *
     * To use with BotBuilder:
     * ```javascript
     * const adapter = new FacebookAdapter({
     *      verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
     *      app_secret: process.env.FACEBOOK_APP_SECRET,
     *      access_token: process.env.FACEBOOK_ACCESS_TOKEN
     * });
     * const server = restify.createServer();
     * server.use(restify.plugins.bodyParser());
     * server.post('/api/messages', (req, res) => {
     *      adapter.processActivity(req, res, async(context) => {
     *          // do your bot logic here!
     *      });
     * });
     * ```
     *
     * In multi-tenancy mode:
     * ```javascript
     * const adapter = new FacebookAdapter({
     *      verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
     *      app_secret: process.env.FACEBOOK_APP_SECRET,
     *       getAccessTokenForPage: async(pageId) => {
     *           // do something to fetch the page access token for pageId.
     *           return token;
     *       })
     * });
     *```
     *
     * @param options Configuration options
     */
    public constructor(options: FacebookAdapterOptions) {
        super();

        this.options = {
            api_host: 'graph.facebook.com',
            api_version: 'v3.2',
            ...options
        };

        if (!this.options.access_token && !this.options.getAccessTokenForPage) {
            const err = 'Adapter must receive either an access_token or a getAccessTokenForPage function.';
            if (!this.options.enable_incomplete) {
                throw new Error(err);
            } else {
                console.error(err);
            }
        }

        if (!this.options.app_secret) {
            const err = 'Provide an app_secret in order to validate incoming webhooks and better secure api requests';
            if (!this.options.enable_incomplete) {
                throw new Error(err);
            } else {
                console.error(err);
            }
        }

        if (this.options.enable_incomplete) {
            const warning = [
                '',
                '****************************************************************************************',
                '* WARNING: Your adapter may be running with an incomplete/unsafe configuration.        *',
                '* - Ensure all required configuration options are present                              *',
                '* - Disable the "enable_incomplete" option!                                            *',
                '****************************************************************************************',
                ''
            ];
            console.warn(warning.join('\n'));
        }

        this.middlewares = {
            spawn: [
                async (bot, next): Promise<void> => {
                    bot.api = await this.getAPI(bot.getConfig('activity'));
                    next();
                }
            ]
        };
    }

    /**
     * Botkit-only: Initialization function called automatically when used with Botkit.
     *      * Amends the webhook_uri with an additional behavior for responding to Facebook's webhook verification request.
     * @param botkit
     */
    public async init(botkit): Promise<any> {
        debug('Add GET webhook endpoint for verification at: ', botkit.getConfig('webhook_uri'));
        if (botkit.webserver) {
            botkit.webserver.get(botkit.getConfig('webhook_uri'), (req, res) => {
                if (req.query['hub.mode'] === 'subscribe') {
                    if (req.query['hub.verify_token'] === this.options.verify_token) {
                        res.send(req.query['hub.challenge']);
                    } else {
                        res.send('OK');
                    }
                }
            });
        }
    }

    /**
     * Get a Facebook API client with the correct credentials based on the page identified in the incoming activity.
     * This is used by many internal functions to get access to the Facebook API, and is exposed as `bot.api` on any BotWorker instances passed into Botkit handler functions.
     *
     * ```javascript
     * let api = adapter.getAPI(activity);
     * let res = api.callAPI('/me/messages', 'POST', message);
     * ```
     * @param activity An incoming message activity
     */
    public async getAPI(activity: Partial<Activity>): Promise<FacebookAPI> {
        if (this.options.access_token) {
            return new FacebookAPI(this.options.access_token, this.options.app_secret, this.options.api_host, this.options.api_version);
        } else {
            if (activity.recipient.id) {
                let pageid = activity.recipient.id;
                // if this is an echo, the page id is actually in the from field
                if (activity.channelData && activity.channelData.message && activity.channelData.message.is_echo === true) {
                    pageid = activity.from.id;
                }
                const token = await this.options.getAccessTokenForPage(pageid);
                if (!token) {
                    throw new Error('Missing credentials for page.');
                }
                return new FacebookAPI(token, this.options.app_secret, this.options.api_host, this.options.api_version);
            } else {
                // No API can be created, this is
                debug('Unable to create API based on activity: ', activity);
            }
        }
    }

    /**
     * Converts an Activity object to a Facebook messenger outbound message ready for the API.
     * @param activity
     */
    private activityToFacebook(activity: any): any {
        const message = {
            recipient: {
                id: activity.conversation.id
            },
            message: {
                text: activity.text,
                sticker_id: undefined,
                attachment: undefined,
                quick_replies: undefined
            },
            messaging_type: 'RESPONSE',
            tag: undefined,
            notification_type: undefined,
            persona_id: undefined,
            sender_action: undefined
        };

        // map these fields to their appropriate place
        if (activity.channelData) {
            if (activity.channelData.messaging_type) {
                message.messaging_type = activity.channelData.messaging_type;
            }

            if (activity.channelData.tag) {
                message.tag = activity.channelData.tag;
            }

            if (activity.channelData.sticker_id) {
                message.message.sticker_id = activity.channelData.sticker_id;
            }

            if (activity.channelData.attachment) {
                message.message.attachment = activity.channelData.attachment;
            }

            if (activity.channelData.persona_id) {
                message.persona_id = activity.channelData.persona_id;
            }

            if (activity.channelData.notification_type) {
                message.notification_type = activity.channelData.notification_type;
            }

            if (activity.channelData.sender_action) {
                message.sender_action = activity.channelData.sender_action;

                // from docs: https://developers.facebook.com/docs/messenger-platform/reference/send-api/
                // Cannot be sent with message. Must be sent as a separate request.
                // When using sender_action, recipient should be the only other property set in the request.
                delete (message.message);
            }

            // make sure the quick reply has a type
            if (activity.channelData.quick_replies) {
                message.message.quick_replies = activity.channelData.quick_replies.map(function(item) {
                    const quick_reply = { ...item };
                    if (!item.content_type) quick_reply.content_type = 'text';
                    return quick_reply;
                });
            }
        }

        debug('OUT TO FACEBOOK > ', message);

        return message;
    }

    /**
     * Standard BotBuilder adapter method to send a message from the bot to the messaging API.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#sendactivities).
     * @param context A TurnContext representing the current incoming message and environment.
     * @param activities An array of outgoing activities to be sent back to the messaging API.
     */
    public async sendActivities(context: TurnContext, activities: Partial<Activity>[]): Promise<ResourceResponse[]> {
        const responses = [];
        for (let a = 0; a < activities.length; a++) {
            const activity = activities[a];
            if (activity.type === ActivityTypes.Message) {
                const message = this.activityToFacebook(activity);
                try {
                    const api = await this.getAPI(context.activity);
                    const res = await api.callAPI('/me/messages', 'POST', message);
                    if (res) {
                        responses.push({ id: res.message_id });
                    }
                    debug('RESPONSE FROM FACEBOOK > ', res);
                } catch (err) {
                    console.error('Error sending activity to Facebook:', err);
                }
            } else {
                // If there are ever any non-message type events that need to be sent, do it here.
                debug('Unknown message type encountered in sendActivities: ', activity.type);
            }
        }

        return responses;
    }

    /**
     * Facebook adapter does not support updateActivity.
     * @ignore
     */
    // eslint-disable-next-line
    public async updateActivity(context: TurnContext, activity: Partial<Activity>): Promise<void> {
        debug('Facebook adapter does not support updateActivity.');
    }

    /**
     * Facebook adapter does not support updateActivity.
     * @ignore
     */
    // eslint-disable-next-line
     public async deleteActivity(context: TurnContext, reference: Partial<ConversationReference>): Promise<void> {
        debug('Facebook adapter does not support deleteActivity.');
    }

    /**
     * Standard BotBuilder adapter method for continuing an existing conversation based on a conversation reference.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#continueconversation)
     * @param reference A conversation reference to be applied to future messages.
     * @param logic A bot logic function that will perform continuing action in the form `async(context) => { ... }`
     */
    public async continueConversation(reference: Partial<ConversationReference>, logic: (context: TurnContext) => Promise<void>): Promise<void> {
        const request = TurnContext.applyConversationReference(
            { type: 'event', name: 'continueConversation' },
            reference,
            true
        );
        const context = new TurnContext(this, request);

        return this.runMiddleware(context, logic);
    }

    /**
     * Accept an incoming webhook request and convert it into a TurnContext which can be processed by the bot's logic.
     * @param req A request object from Restify or Express
     * @param res A response object from Restify or Express
     * @param logic A bot logic function in the form `async(context) => { ... }`
     */
    public async processActivity(req, res, logic: (context: TurnContext) => Promise<void>): Promise<void> {
        debug('IN FROM FACEBOOK >', req.body);
        if (await this.verifySignature(req, res) === true) {
            const event = req.body;
            if (event.entry) {
                for (let e = 0; e < event.entry.length; e++) {
                    let payload = null;
                    const entry = event.entry[e];

                    // handle normal incoming stuff
                    if (entry.changes) {
                        payload = entry.changes;
                    } else if (entry.messaging) {
                        payload = entry.messaging;
                    }

                    for (let m = 0; m < payload.length; m++) {
                        await this.processSingleMessage(payload[m], logic);
                    }

                    // handle standby messages (this bot is not the active receiver)
                    if (entry.standby) {
                        payload = entry.standby;

                        for (let m = 0; m < payload.length; m++) {
                            const message = payload[m];
                            // indiciate that this message was received in standby mode rather than normal mode.
                            message.standby = true;
                            await this.processSingleMessage(message, logic);
                        }
                    }
                }

                res.status(200);
                res.end();
            }
        }
    }

    /**
     * Handles each individual message inside a webhook payload (webhook may deliver more than one message at a time)
     * @param message
     * @param logic
     */
    private async processSingleMessage(message: any, logic: any): Promise<void> {
        //  in case of Checkbox Plug-in sender.id is not present, instead we should look at optin.user_ref
        if (!message.sender && message.optin && message.optin.user_ref) {
            message.sender = { id: message.optin.user_ref };
        }

        const activity: Activity = {
            channelId: 'facebook',
            timestamp: new Date(),
            // @ts-ignore ignore missing optional fields
            conversation: {
                id: message.sender.id
            },
            from: {
                id: message.sender.id,
                name: message.sender.id
            },
            recipient: {
                id: message.recipient.id,
                name: message.recipient.id
            },
            channelData: message,
            type: ActivityTypes.Event,
            text: null
        };

        if (message.message) {
            activity.type = ActivityTypes.Message;
            activity.text = message.message.text;

            if (activity.channelData.message.is_echo) {
                activity.type = ActivityTypes.Event;
            }

            // copy fields like attachments, sticker, quick_reply, nlp, etc.
            for (const key in message.message) {
                activity.channelData[key] = message.message[key];
            }
        } else if (message.postback) {
            activity.type = ActivityTypes.Message;
            activity.text = message.postback.payload;
        }

        const context = new TurnContext(this, activity as Activity);
        await this.runMiddleware(context, logic);
    }

    /*
     * Verifies the SHA1 signature of the raw request payload before bodyParser parses it
     * Will abort parsing if signature is invalid, and pass a generic error to response
     */
    private async verifySignature(req, res): Promise<boolean> {
        const expected = req.headers['x-hub-signature'];
        const hmac = crypto.createHmac('sha1', this.options.app_secret);
        hmac.update(req.rawBody, 'utf8');
        const calculated = 'sha1=' + hmac.digest('hex');
        if (expected !== calculated) {
            res.status(401);
            debug('Token verification failed, Ignoring message');
            throw new Error('Invalid signature on incoming request');
        } else {
            return true;
        }
    }
}

/**
 * This interface defines the options that can be passed into the FacebookAdapter constructor function.
 */
export interface FacebookAdapterOptions {
    /**
     * Alternate root url used to contruct calls to Facebook's API.  Defaults to 'graph.facebook.com' but can be changed (for mocking, proxy, etc).
     */
    api_host?: string;
    /**
     * Alternate API version used to construct calls to Facebook's API. Defaults to v3.2
     */
    api_version?: string;

    /**
     * The "verify token" used to initially create and verify the Webhooks subscription settings on Facebook's developer portal.
     */
    verify_token: string;

    /**
     * The "app secret" from the "basic settings" page from your app's configuration in the Facebook developer portal
     */
    app_secret: string;

    /**
     * When bound to a single page, use `access_token` to specify the "page access token" provided in the Facebook developer portal's "Access Tokens" widget of the "Messenger Settings" page.
     */
    access_token?: string;

    /**
     * When bound to multiple teams, provide a function that, given a page id, will return the page access token for that page.
     */
    getAccessTokenForPage?: (pageId: string) => Promise<string>;

    /**
     * Allow the adapter to startup without a complete configuration.
     * This is risky as it may result in a non-functioning or insecure adapter.
     * This should only be used when getting started.
     */
    enable_incomplete?: boolean;
}
