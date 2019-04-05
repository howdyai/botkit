/**
 * @module botbuilder-adapter-webex
 */
import { Activity, ActivityTypes, BotAdapter, ResourceResponse, ConversationReference, TurnContext } from 'botbuilder';
import * as ciscospark from 'ciscospark';
import * as url from 'url';
import * as crypto from 'crypto';
import * as Debug from 'debug';
const debug = Debug('botkit:webex');

export class WebexAdapter extends BotAdapter {
    // TODO: add typedefs to these
    private _config: any;
    private _api: any;
    private _identity: any;

    public name: string;
    public middlewares;

    public constructor(config) {
        super();

        this._config = {
            ...config
        };

        if (!this._config.access_token) {
            throw new Error('access_token required to create controller');
        } else {
            this._api = ciscospark.init({
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
            // throw new Error('secret parameter required to secure webhooks');
        }

        // Botkit Plugin additions
        this.name = 'Webex Adapter';
        this.middlewares = {
            spawn: [
                async (bot, next) => {
                    // make webex api directly available on a botkit instance.
                    bot.api = this._api;

                    // TODO: put this in a botworker
                    bot.startPrivateConversation = async function(userId: string) {
                        // send a message with the toPersonId or toPersonEmail set
                        // response will have the roomID
                        return this.changeContext({
                            from: { id: userId },
                            conversation: { id: 'temp' }, // TODO: this is fake
                            channelId: 'webex'
                        });
                    };

                    next();
                }
            ]
        };
    }

    // Botkit init function, called only when used alongside Botkit
    public init(botkit): void {
        // when the bot is ready, register the webhook subscription with the Webex API
        botkit.ready(() => {
            debug('Registering webhook subscription!');
            botkit.adapter.registerWebhookSubscription(botkit.getConfig('webhook_uri'));
        });
    }

    // TODO: make async
    public resetWebhookSubscriptions(): void {
        this._api.webhooks.list().then((list) => {
            for (var i = 0; i < list.items.length; i++) {
                this._api.webhooks.remove(list.items[i]).then(function() {
                    // console.log('Removed subscription: ' + list.items[i].name);
                }).catch(function(err) {
                    console.error('Error removing subscription:', err);
                });
            }
        });
    };

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

    public async sendActivities(context: TurnContext, activities: Partial<Activity>[]): Promise<ResourceResponse[]> {
        const responses = [];
        for (var a = 0; a < activities.length; a++) {
            const activity = activities[a];
            debug('OUTGOING ACTIVITY', activity);

            // TODO: support additional fields
            // https://developer.webex.com/docs/api/v1/messages/create-a-message
            const message = {
                roomId: activity.conversation ? activity.conversation.id : null,
                toPersonId: activity.conversation ? null : activity.recipient.id,
                text: activity.text
            };

            let response = await this._api.messages.create(message);

            responses.push(response);
        }

        return responses;
    }

    public async updateActivity(context: TurnContext, activity: Partial<Activity>): Promise<void> {
        if (activity.id && activity.conversation) {
            // TODO: Does webex support replacing messages
        } else {
            throw new Error('Cannot update activity: activity is missing id');
        }
    }

    public async deleteActivity(context: TurnContext, reference: Partial<ConversationReference>): Promise<void> {
        if (reference.activityId && reference.conversation) {
            // TODO: Does webex support deleting messages
        } else {
            throw new Error('Cannot delete activity: reference is missing activityId');
        }
    }

    public async continueConversation(reference: Partial<ConversationReference>, logic: (context: TurnContext) => Promise<void>): Promise<void> {
        const request = TurnContext.applyConversationReference(
            { type: 'event', name: 'continueConversation' },
            reference,
            true
        );
        const context = new TurnContext(this, request);

        return this.runMiddleware(context, logic);
    }

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
                channelData: payload,
                type: ActivityTypes.Event
            };

            const context = new TurnContext(this, activity);

            this.runMiddleware(context, logic)
                .catch((err) => { console.error(err.toString()); });
        }
    }
}
