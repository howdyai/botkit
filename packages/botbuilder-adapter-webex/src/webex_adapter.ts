/**
 * @module botbuilder-adapter-webex
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity, ActivityTypes, BotAdapter, ResourceResponse, ConversationReference, TurnContext } from 'botbuilder';
import { WebexBotWorker } from './botworker';
import * as Webex from 'webex';
import * as url from 'url';
import * as crypto from 'crypto';
import * as Debug from 'debug';
const debug = Debug('botkit:webex');

export interface WebexAdapterOptions {
    /**
     * An access token for the bot. Get one from [https://developer.webex.com/](https://developer.webex.com/)
     */
    access_token: string;
    /**
     * Secret used to validate incoming webhooks - you can define this yourself
     */
    secret?: string;
    /**
     * The root URL of your bot application.  Something like `https://mybot.com/`
     */
    public_address: string;
    /**
     * a name for the webhook subscription that will be created to tell Webex to send your bot webhooks.
     */
    webhook_name?: string;
    /**
     * Allow the adapter to startup without a complete configuration.
     * This is risky as it may result in a non-functioning or insecure adapter.
     * This should only be used when getting started.
     */
    enable_incomplete?: boolean;
}

/**
 * Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Webex Teams.
 */
export class WebexAdapter extends BotAdapter {
    private options: WebexAdapterOptions;

    private _api: Webex;
    private _identity: any;

    /**
     * Name used by Botkit plugin loader
     * @ignore
     */
    public name = 'Webex Adapter';

    /**
     * Object containing one or more Botkit middlewares to bind automatically.
     * @ignore
     */
    public middlewares;

    /**
     * A customized BotWorker object that exposes additional utility methods.
     * @ignore
     */
    public botkit_worker = WebexBotWorker;

    /**
     * Create a Webex adapter. See [WebexAdapterOptions](#webexadapteroptions) for a full definition of the allowed parameters.
     *
     * Use with Botkit:
     *```javascript
     * const adapter = new WebexAdapter({
     *      access_token: process.env.ACCESS_TOKEN, // access token from https://developer.webex.com
     *      public_address: process.env.PUBLIC_ADDRESS,  // public url of this app https://myapp.com/
     *      secret: process.env.SECRET // webhook validation secret - you can define this yourself
     * });
     * const controller = new Botkit({
     *      adapter: adapter,
     *      // ... other configuration options
     * });
     * ```
     *
     * Use with BotBuilder:
     *```javascript
     * const adapter = new WebexAdapter({
     *      access_token: process.env.ACCESS_TOKEN, // access token from https://developer.webex.com
     *      public_address: process.env.PUBLIC_ADDRESS,  // public url of this app https://myapp.com/
     *      secret: process.env.SECRET // webhook validation secret - you can define this yourself
     * });
     *
     * // set up restify...
     * const server = restify.createServer();
     * server.use(restify.plugins.bodyParser());
     * // register the webhook subscription to start receiving messages - Botkit does this automatically!
     * adapter.registerWebhookSubscription('/api/messages');
     * // Load up the bot's identity, otherwise it won't know how to filter messages from itself
     * adapter.getIdentity();
     * // create an endpoint for receiving messages
     * server.post('/api/messages', (req, res) => {
     *      adapter.processActivity(req, res, async(context) => {
     *          // do your bot logic here!
     *      });
     * });
     * ```
     *
     * @param options An object containing API credentials, a webhook verification token and other options
     */
    public constructor(config: WebexAdapterOptions) {
        super();

        this.options = {
            ...config
        };

        if (!this.options.access_token) {
            const err = 'Missing required parameter `access_token`';
            if (!this.options.enable_incomplete) {
                throw new Error(err);
            } else {
                console.error(err);
            }
        } else {
            this._api = Webex.init({
                credentials: {
                    authorization: {
                        access_token: this.options.access_token
                    }
                }
            });

            if (!this._api) {
                const err = 'Could not create the Webex Teams API client';
                if (!this.options.enable_incomplete) {
                    throw new Error(err);
                } else {
                    console.error(err);
                }
            }
        }

        if (!this.options.public_address) {
            const err = 'Missing required parameter `public_address`';
            if (!this.options.enable_incomplete) {
                throw new Error(err);
            } else {
                console.error(err);
            }
        } else {
            const endpoint = new url.URL(this.options.public_address);
            if (!endpoint.hostname) {
                throw new Error('Could not determine hostname of public address: ' + this.options.public_address);
            } else {
                this.options.public_address = endpoint.hostname + (endpoint.port ? ':' + endpoint.port : '');
            }
        }

        if (!this.options.secret) {
            console.warn('WARNING: No secret specified. Source of incoming webhooks will not be validated. https://developer.webex.com/webhooks-explained.html#auth');
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

        // Botkit Plugin additions
        this.middlewares = {
            spawn: [
                async (bot, next): Promise<void> => {
                    // make webex api directly available on a botkit instance.
                    bot.api = this._api;

                    next();
                }
            ]
        };
    }

    /**
     * Load the bot's identity via the Webex API.
     * MUST be called by BotBuilder bots in order to filter messages sent by the bot.
     */
    public async getIdentity(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this._api) {
                this._api.people.get('me').then((identity) => {
                    debug('Webex: My identity is', identity);
                    this._identity = identity;
                    resolve(identity);
                }).catch((err) => {
                    reject(err);
                });
            } else {
                reject(new Error('No API client configured'));
            }
        });
    }

    /**
     * Returns the identity of the bot, including {id, emails, displayName, created} and anything else from [this spec](https://webex.github.io/spark-js-sdk/api/#personobject)
     */
    public get identity(): any {
        return this._identity || {};
    }

    /**
     * Botkit-only: Initialization function called automatically when used with Botkit.
     *      * Calls registerWebhookSubscription() during bootup.
     *      * Calls getIdentit() to load the bot's identity.
     */
    public init(botkit): void {
        // when the bot is ready, register the webhook subscription with the Webex API

        botkit.addDep('webex-identity');

        this.getIdentity().then(() => {
            botkit.completeDep('webex-identity');
        }).catch((err) => {
            throw new Error(err);
        });

        botkit.ready(() => {
            debug('Registering webhook subscription!');
            botkit.adapter.registerWebhookSubscription(botkit.getConfig('webhook_uri'));
        });
    }

    /**
     * Clear out and reset all the webhook subscriptions currently associated with this application.
     */
    public async resetWebhookSubscriptions(): Promise<any> {
        return new Promise<void>((resolve, reject) => {
            this._api.webhooks.list().then(async (list) => {
                for (let i = 0; i < list.items.length; i++) {
                    await this._api.webhooks.remove(list.items[i]).catch(reject);
                }
                resolve();
            });
        });
    };

    /**
     * Register a webhook subscription with Webex Teams to start receiving message events.
     * @param webhook_path the path of the webhook endpoint like `/api/messages`
     */
    public registerWebhookSubscription(webhook_path): void {
        const webhook_name = this.options.webhook_name || 'Botkit Firehose';

        this._api.webhooks.list().then((list) => {
            let hook_id = null;

            for (let i = 0; i < list.items.length; i++) {
                if (list.items[i].name === webhook_name) {
                    hook_id = list.items[i].id;
                }
            }

            const hook_url = 'https://' + this.options.public_address + webhook_path;

            debug('Webex: incoming webhook url is ', hook_url);

            if (hook_id) {
                this._api.webhooks.update({
                    id: hook_id,
                    resource: 'all',
                    targetUrl: hook_url,
                    event: 'all',
                    secret: this.options.secret,
                    name: webhook_name
                }).then(function() {
                    debug('Webex: SUCCESSFULLY UPDATED WEBEX WEBHOOKS');
                }).catch(function(err) {
                    console.error('FAILED TO REGISTER WEBHOOK', err);
                    throw new Error(err);
                });
            } else {
                this._api.webhooks.create({
                    resource: 'all',
                    targetUrl: hook_url,
                    event: 'all',
                    secret: this.options.secret,
                    name: webhook_name
                }).then(function() {
                    debug('Webex: SUCCESSFULLY REGISTERED WEBEX WEBHOOKS');
                }).catch(function(err) {
                    console.error('FAILED TO REGISTER WEBHOOK', err);
                    throw new Error(err);
                });
            }
        }).catch(function(err) {
            throw new Error(err);
        });
    }

    /**
     * Register a webhook subscription with Webex Teams to start receiving message events.
     * @param webhook_path the path of the webhook endpoint like `/api/messages`
     */
    public registerAdaptiveCardWebhookSubscription(webhook_path): void {
        const webhook_name = this.options.webhook_name || 'Botkit AttachmentActions';

        this._api.webhooks.list().then((list) => {
            let hook_id = null;

            for (let i = 0; i < list.items.length; i++) {
                if (list.items[i].name === webhook_name) {
                    hook_id = list.items[i].id;
                }
            }

            const hook_url = 'https://' + this.options.public_address + webhook_path;

            debug('Webex: incoming webhook url is ', hook_url);

            if (hook_id) {
                this._api.webhooks.update({
                    id: hook_id,
                    resource: 'attachmentActions',
                    targetUrl: hook_url,
                    event: 'all',
                    secret: this.options.secret,
                    name: webhook_name
                }).then(function() {
                    debug('Webex: SUCCESSFULLY UPDATED WEBEX WEBHOOKS');
                }).catch(function(err) {
                    console.error('FAILED TO REGISTER WEBHOOK', err);
                    throw new Error(err);
                });
            } else {
                this._api.webhooks.create({
                    resource: 'attachmentActions',
                    targetUrl: hook_url,
                    event: 'all',
                    secret: this.options.secret,
                    name: webhook_name
                }).then(function() {
                    debug('Webex: SUCCESSFULLY REGISTERED WEBEX WEBHOOKS');
                }).catch(function(err) {
                    console.error('FAILED TO REGISTER WEBHOOK', err);
                    throw new Error(err);
                });
            }
        }).catch(function(err) {
            throw new Error(err);
        });
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
                debug('OUTGOING ACTIVITY', activity);

                // transform activity into the webex message format
                // https://developer.webex.com/docs/api/v1/messages/create-a-message
                const message: any = {};
                if (activity.channelData && activity.channelData.files) {
                    message.files = activity.channelData.files;
                }
                if (activity.text) {
                    message.text = activity.text;
                }
                if (activity.channelData && activity.channelData.markdown) {
                    message.markdown = activity.channelData.markdown;
                }
                if (activity.conversation && activity.conversation.id) {
                    message.roomId = activity.conversation.id;
                } else if (!activity.conversation && activity.recipient.id) {
                    message.toPersonId = activity.recipient.id;
                } else if (activity.channelData && activity.channelData.toPersonEmail) {
                    message.toPersonEmail = activity.channelData.toPersonEmail;
                }

                if (activity.attachments) {
                    message.attachments = activity.attachments;
                } else if (activity.channelData && activity.channelData.attachments) {
                    message.attachments = activity.channelData.attachments;
                }

                // @ts-ignore ignore this webex specific field
                if (activity.conversation && activity.conversation.parentId) {
                    // @ts-ignore ignore this webex specific field
                    message.parentId = activity.conversation.parentId;
                } else if (activity.channelData && activity.channelData.parentId) {
                    message.parentId = activity.channelData.parentId;
                }

                const response = await this._api.messages.create(message);

                responses.push(response);
            } else {
                // If there are ever any non-message type events that need to be sent, do it here.
                debug('Unknown message type encountered in sendActivities: ', activity.type);
            }
        }

        return responses;
    }

    /**
     * Webex adapter does not support updateActivity.
     * @ignore
     */
    // eslint-disable-next-line
    public async updateActivity(context: TurnContext, activity: Partial<Activity>): Promise<void> {
        debug('Webex adapter does not support updateActivity.');
    }

    /**
     * Standard BotBuilder adapter method to delete a previous message.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#deleteactivity).
     * @param context A TurnContext representing the current incoming message and environment. (not used)
     * @param reference An object in the form `{activityId: <id of message to delete>, conversation: { id: <id of slack channel>}}`
     */
    public async deleteActivity(context: TurnContext, reference: Partial<ConversationReference>): Promise<void> {
        if (reference.activityId) {
            try {
                await this._api.messages.remove({ id: reference.activityId });
            } catch (err) {
                throw new Error(err);
            }
        } else {
            throw new Error('Cannot delete activity: reference is missing activityId');
        }
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
    public async processActivity(req, res, logic: (context: TurnContext) => Promise<void>): Promise<any> {
        res.status(200);
        res.end();

        const payload = req.body;
        let activity;

        if (this.options.secret) {
            const signature = req.headers['x-spark-signature'];
            const hash = crypto.createHmac('sha1', this.options.secret).update(JSON.stringify(payload)).digest('hex');
            if (signature !== hash) {
                console.warn('WARNING: Webhook received message with invalid signature. Potential malicious behavior!');
                return false;
            }
        }

        if (payload.resource === 'messages' && payload.event === 'created') {
            const decrypted_message = await this._api.messages.get(payload.data);

            activity = {
                id: decrypted_message.id,
                timestamp: new Date(),
                channelId: 'webex',
                conversation: { id: decrypted_message.roomId, parentId: decrypted_message.parentId },
                from: { id: decrypted_message.personId, name: decrypted_message.personEmail },
                recipient: { id: this.identity.id },
                text: decrypted_message.text,
                channelData: decrypted_message,
                type: ActivityTypes.Message,
                parentId: decrypted_message.parentId
            };

            // add in some fields from the original payload
            activity.channelData.orgId = payload.orgId;
            activity.channelData.createdBy = payload.createdBy;
            activity.channelData.appId = payload.appId;
            activity.channelData.actorId = payload.actorId;

            // this is the bot speaking
            if (activity.from.id === this.identity.id) {
                activity.channelData.botkitEventType = 'self_message';
                activity.type = ActivityTypes.Event;
            } else {
                // change the event type of messages sent in 1:1s
                if (activity.channelData.roomType === 'direct') {
                    activity.channelData.botkitEventType = 'direct_message';
                }
            }

            if (decrypted_message.html) {
                // strip the mention & HTML from the message
                let pattern = new RegExp('^(<p>|<div>)?<spark-mention .*?data-object-id="' + this.identity.id + '".*?>.*?</spark-mention>', 'im');
                if (!decrypted_message.html.match(pattern)) {
                    const encoded_id = this.identity.id;
                    const decoded = Buffer.from(encoded_id, 'base64').toString('ascii');

                    // this should look like ciscospark://us/PEOPLE/<id string>
                    let matches;
                    if ((matches = decoded.match(/ciscospark:\/\/.*\/(.*)/im))) {
                        pattern = new RegExp('^(<p>|<div>)?<spark-mention .*?data-object-id="' + matches[1] + '".*?>.*?</spark-mention>', 'im');
                    }
                }
                let action = decrypted_message.html.replace(pattern, '');

                // strip the remaining HTML tags
                action = action.replace(/<.*?>/img, '');

                // strip remaining whitespace
                action = action.trim();

                // replace the message text with the the HTML version
                activity.text = action;
            } else {
                const pattern = new RegExp('^' + this.identity.displayName + '\\s+', 'i');
                if (activity.text) {
                    activity.text = activity.text.replace(pattern, '');
                }
            }

            // create a conversation reference
            const context = new TurnContext(this, activity);

            this.runMiddleware(context, logic)
                .catch((err) => { console.error(err.toString()); });
        } else if (payload.resource === 'attachmentActions' && payload.event === 'created') {
            const decrypted_message = await this._api.attachmentActions.get(payload.data);

            activity = {
                id: decrypted_message.id,
                timestamp: new Date(),
                channelId: 'webex',
                conversation: { id: decrypted_message.roomId },
                from: { id: decrypted_message.personId, name: decrypted_message.personEmail },
                recipient: { id: this.identity.id },
                value: decrypted_message.inputs,
                channelData: decrypted_message,
                type: ActivityTypes.Event
            };

            // add in some fields from the original payload
            activity.channelData.orgId = payload.orgId;
            activity.channelData.createdBy = payload.createdBy;
            activity.channelData.appId = payload.appId;
            activity.channelData.actorId = payload.actorId;

            activity.channelData.botkitEventType = 'attachmentActions';

            // create a conversation reference
            const context = new TurnContext(this, activity);

            this.runMiddleware(context, logic)
                .catch((err) => { console.error(err.toString()); });
        } else {
            // type == payload.resource + '.' + payload.event
            // memberships.deleted for example
            // payload.data contains stuff
            activity = {
                id: payload.id,
                timestamp: new Date(),
                channelId: 'webex',
                conversation: { id: payload.data.roomId },
                from: { id: payload.actorId },
                recipient: { id: this.identity.id },
                channelData: {
                    ...payload,
                    botkitEventType: payload.resource + '.' + payload.event
                },
                type: ActivityTypes.Event
            };

            const context = new TurnContext(this, activity);

            this.runMiddleware(context, logic)
                .catch((err) => { console.error(err.toString()); });
        }
    }
}
