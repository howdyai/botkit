/**
 * @module botbuilder-adapter-webex
 */
import { Activity, ActivityTypes, BotAdapter, ResourceResponse, ConversationReference, TurnContext } from 'botbuilder';
import { WebexBotWorker } from './botworker';
import * as Ciscospark from 'ciscospark';
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
}

/**
 * Connect Botkit or BotBuilder to Webex Teams. See [WebexAdapterOptions](#WebexAdapterOptions) for parameters.
 *
 * Use with Botkit:
 *```javascript
 * const adapter = new WebexAdapter({
 *     access_token: process.env.ACCESS_TOKEN,
 *     public_address: process.env.PUBLIC_ADDRESS
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
*     access_token: process.env.ACCESS_TOKEN,
*     public_address: process.env.PUBLIC_ADDRESS
* });
* // set up restify...
* const server = restify.createServer();
* server.use(restify.plugins.bodyParser());
* // register the webhook subscription to start receiving messages - Botkit does this automatically!
* adapter.registerWebhookSubscription('/api/messages');
* // create an endpoint for receiving messages
* server.post('/api/messages', (req, res) => {
*      adapter.processActivity(req, res, async(context) => {
*          // do your bot logic here!
*      });
* });
* ```
*/
export class WebexAdapter extends BotAdapter {
    private _config: WebexAdapterOptions;

    private _api: Ciscospark;
    private _identity: any;

    /**
     * Name used by Botkit plugin loader
     * @ignore
     */
    public name: string = 'Webex Adapter';

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
     * ```javascript
     * const adapter = new WebexAdapter({
     *      access_token: process.env.ACCESS_TOKEN, // access token from https://developer.webex.com
     *      public_address: process.env.PUBLIC_ADDRESS,  // public url of this app https://myapp.com/
     *      secret: process.env.SECRET // webhook validation secret - you can define this yourself
     * });
     * ```
     *
     * @param options An object containing API credentials, a webhook verification token and other options
     */
    public constructor(config: WebexAdapterOptions) {
        super();

        this._config = {
            ...config
        };

        if (!this._config.access_token) {
            throw new Error('access_token required to create controller');
        } else {
            this._api = Ciscospark.init({
                credentials: {
                    authorization: {
                        access_token: this._config.access_token
                    }
                }
            });

            if (!this._api) {
                throw new Error('Could not create the Webex Teams API client');
            }

            this._api.people.get('me').then((identity) => {
                debug('Webex: My identity is', identity);
                this._identity = identity;
            }).catch(function(err) {
                throw new Error(err);
            });
        }

        if (!this._config.public_address) {
            throw new Error('public_address parameter required to receive webhooks');
        } else {
            var endpoint = url.parse(this._config.public_address);
            if (!endpoint.hostname) {
                throw new Error('Could not determine hostname of public address: ' + this._config.public_address);
            } else {
                this._config.public_address = endpoint.hostname + (endpoint.port ? ':' + endpoint.port : '');
            }
        }

        if (!this._config.secret) {
            console.warn('WARNING: No secret specified. Source of incoming webhooks will not be validated. https://developer.webex.com/webhooks-explained.html#auth');
        }

        // Botkit Plugin additions
        this.middlewares = {
            spawn: [
                async (bot, next) => {
                    // make webex api directly available on a botkit instance.
                    bot.api = this._api;

                    next();
                }
            ]
        };
    }

    /**
     * Returns the identity of the bot, including {id, emails, displayName, created} and anything else from [this spec](https://webex.github.io/spark-js-sdk/api/#personobject)
     */
    public get identity(): any {
        return this._identity;
    }

    /**
     *  Botkit init function, called automatically when used alongside Botkit.
     * Calls registerWebhookSubscription() during bootup.
     */
    public init(botkit): void {
        // when the bot is ready, register the webhook subscription with the Webex API
        botkit.ready(() => {
            debug('Registering webhook subscription!');
            botkit.adapter.registerWebhookSubscription(botkit.getConfig('webhook_uri'));
        });
    }

    /**
     * Clear out and reset all the webhook subscriptions currently associated with this application.
     */
    public async resetWebhookSubscriptions(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            this._api.webhooks.list().then(async (list) => {
                for (var i = 0; i < list.items.length; i++) {
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
        var webhook_name = this._config.webhook_name || 'Botkit Firehose';

        this._api.webhooks.list().then((list) => {
            var hook_id = null;

            for (var i = 0; i < list.items.length; i++) {
                if (list.items[i].name === webhook_name) {
                    hook_id = list.items[i].id;
                }
            }

            var hook_url = 'https://' + this._config.public_address + webhook_path;

            debug('Webex: incoming webhook url is ', hook_url);

            if (hook_id) {
                this._api.webhooks.update({
                    id: hook_id,
                    resource: 'all',
                    targetUrl: hook_url,
                    event: 'all',
                    secret: this._config.secret,
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
                    secret: this._config.secret,
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
        for (var a = 0; a < activities.length; a++) {
            const activity = activities[a];
            if (activity.type === ActivityTypes.Message) {
                // debug('OUTGOING ACTIVITY', activity);

                // transform activity into the webex message format
                // https://developer.webex.com/docs/api/v1/messages/create-a-message
                const message = {
                    roomId: activity.conversation ? activity.conversation.id : null,
                    toPersonId: activity.conversation ? null : activity.recipient.id,
                    toPersonEmail: activity.channelData && activity.channelData.toPersonEmail ? activity.channelData.toPersonEmail : null,
                    text: activity.text,
                    markdown: activity.channelData ? activity.channelData.markdown : null,
                    files: activity.channelData ? activity.channelData.files : null
                };

                let response = await this._api.messages.create(message);

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

        var payload = req.body;
        let activity;

        if (this._config.secret) {
            var signature = req.headers['x-spark-signature'];
            var hash = crypto.createHmac('sha1', this._config.secret).update(JSON.stringify(payload)).digest('hex');
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
                conversation: { id: decrypted_message.roomId },
                from: { id: decrypted_message.personId, name: decrypted_message.personEmail },
                text: decrypted_message.text,
                channelData: decrypted_message,
                type: ActivityTypes.Message
            };

            // this is the bot speaking
            if (activity.from.id === this._identity.id) {
                activity.channelData.botkitEventType = 'self_message';
                activity.type = ActivityTypes.Event;
            }

            if (decrypted_message.html) {
                // strip the mention & HTML from the message
                let pattern = new RegExp('^(<p>)?<spark-mention .*?data-object-id="' + this._identity.id + '".*?>.*?</spark-mention>', 'im');
                if (!decrypted_message.html.match(pattern)) {
                    var encoded_id = this._identity.id;
                    var decoded = Buffer.from(encoded_id, 'base64').toString('ascii');

                    // this should look like ciscospark://us/PEOPLE/<id string>
                    var matches;
                    if ((matches = decoded.match(/ciscospark:\/\/.*\/(.*)/im))) {
                        pattern = new RegExp('^(<p>)?<spark-mention .*?data-object-id="' + matches[1] + '".*?>.*?</spark-mention>', 'im');
                    }
                }
                var action = decrypted_message.html.replace(pattern, '');

                // strip the remaining HTML tags
                action = action.replace(/<.*?>/img, '');

                // strip remaining whitespace
                action = action.trim();

                // replace the message text with the the HTML version
                activity.text = action;
            } else {
                let pattern = new RegExp('^' + this._identity.displayName + '\\s+', 'i');
                if (activity.text) {
                    activity.text = activity.text.replace(pattern, '');
                }
            }

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
