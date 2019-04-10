/**
 * @module botbuilder-adapter-facebook
 */

import { Activity, ActivityTypes, BotAdapter, TurnContext, ConversationReference, ResourceResponse } from 'botbuilder';
import * as Debug from 'debug';
// import { FacebookBotWorker } from './botworker';
import { FacebookAPI } from './facebook_api';
import * as crypto from 'crypto';
const debug = Debug('botkit:facebook');

export interface FacebookAdapterOptions {
    api_host?: string;
    verify_token: string;
    app_secret: string;
    access_token?: string;
    getAccessTokenForPage?: (pageId: string) => Promise<string>;
}

export class FacebookAdapter extends BotAdapter {
    // Botkit Plugin fields
    public name: string;
    public middlewares;

    private options: FacebookAdapterOptions;

    // tell botkit to use this type of worker
    // public botkit_worker = FacebookBotWorker;

    private api_version: string = 'v2.11';
    private api_host: string = 'graph.facebook.com';

    public constructor(options: FacebookAdapterOptions) {
        super();

        this.options = options;

        if (this.options.api_host) {
            this.api_host = this.options.api_host;
        }

        this.name = 'Facebook Adapter';

        if (!this.options.access_token && !this.options.getAccessTokenForPage) {
            throw new Error('Adapter must receive either an access_token or a getAccessTokenForPage function.');
        }

        this.middlewares = {
            spawn: [
                async (bot, next) => {
                    // bot.api = this.api;
                    next();
                }
            ]
        };
    }

    public async init(botkit): Promise<any> {
        debug('Add GET webhook endpoint for verification at: ', botkit.getConfig('webhook_uri'));
        botkit.webserver.get(botkit.getConfig('webhook_uri', function(req, res) {
            if (req.query['hub.mode'] === 'subscribe') {
                if (req.query['hub.verify_token'] === this.options.verify_token) {
                    res.send(req.query['hub.challenge']);
                } else {
                    res.send('OK');
                }
            }
        }));
    }

    /**
     * Get a Facebook API client with the correct credentials based on the page identified in the incoming activity.
     * This is used by many internal functions to get access to the Facebook API, and is exposed as `bot.api` on any bot worker instances.
     * @param activity An incoming message activity
     */
    public async getAPI(activity: Partial<Activity>): Promise<FacebookAPI> {
        if (this.options.access_token) {
            return new FacebookAPI(this.options.access_token);
        } else {
            if (activity.recipient.id) {
                const token = await this.options.getAccessTokenForPage(activity.recipient.id);
                if (!token) {
                    throw new Error('Missing credentials for page.');
                }
                return new FacebookAPI(token);
            } else {
                // No API can be created, this is
                debug('Unable to create API based on activity: ', activity);
            }
        }
    }


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
            }

            // make sure the quick reply has a type
            if (activity.channelData.quick_replies) {
                message.message.quick_replies = activity.channelData.quick_replies.map(function(item) {
                    var quick_reply = { ...item };
                    if (!item.content_type) quick_reply.content_type = 'text';
                    return quick_reply;
                });
            }
        }

        debug('OUT TO FACEBOOK > ', message);

        return message;
    }

    public async sendActivities(context: TurnContext, activities: Partial<Activity>[]): Promise<ResourceResponse[]> {
        const responses = [];
        for (var a = 0; a < activities.length; a++) {
            const activity = activities[a];
            if (activity.type === ActivityTypes.Message) {
                const message = this.activityToFacebook(activity);
                try {
                    var api = await this.getAPI(context.activity);
                    const res = await api.callAPI('/me/messages', 'POST', message);
                    responses.push({ id: res.message_id });
                    debug('RESPONSE FROM FACEBOOK > ', res);
                } catch (err) {
                    console.error('Error sending activity to Facebook:', err);
                }
            } else {
                // TODO: Handle sending of other types of message?
            }
        }

        return responses;
    }

    public async updateActivity(context: TurnContext, activity: Partial<Activity>): Promise<void> {
        if (activity.id) {
            // TODO: is there a facebook api to update a message??
            try {
                // const results = await this.api.spaces.messages.update({
                //     name: activity.id,
                //     updateMask: 'text,cards',
                //     resource: {
                //         text: activity.text,
                //         // @ts-ignore allow cards field
                //         cards: activity.cards ? activity.cards : (activity.channelData ? activity.channelData.cards : null),
                //     }
                // });

                // TODO: evaluate success

            } catch (err) {
                console.error('Error updating activity on Hangouts:', err);
            }
        } else {
            throw new Error('Cannot update activity: activity is missing id');
        }
    }

    public async deleteActivity(context: TurnContext, reference: Partial<ConversationReference>): Promise<void> {
        if (reference.activityId) {
            try {

                // TODO: is there a facebook api to delete a message?
                // const results = await this.api.spaces.messages.delete({
                //     name: reference.activityId,
                // });

                // TODO: evaluate success
            } catch (err) {
                console.error('Error deleting activity', err);
                throw err;
            }
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

    public async processActivity(req, res, logic: (context: TurnContext) => Promise<void>): Promise<void> {
        debug('IN FROM FACEBOOK >', req.body);
        if (await this.verifySignature(req, res) === true) {
            let event = req.body;
            if (event.entry) {
                for (var e = 0; e < event.entry.length; e++) {
                    let payload = null;
                    let entry = event.entry[e];

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
                        payload = entry.standyby;

                        for (let m = 0; m < payload.length; m++) {
                            // TODO: do some stuff here to indicate
                            let message = payload[m];
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

    private async processSingleMessage(message: any, logic: any): Promise<void> {
        //  in case of Checkbox Plug-in sender.id is not present, instead we should look at optin.user_ref
        if (!message.sender && message.optin && message.optin.user_ref) {
            message.sender = { id: message.optin.user_ref };
        }

        const activity = {
            channelId: 'facebook',
            timestamp: new Date(),
            conversation: {
                id: message.sender.id
            },
            from: {
                id: message.sender.id,
                name: message.sender.id
            },
            recipient: {
                id: message.recipient.id
            },
            channelData: message,
            type: ActivityTypes.Event,
            text: null
        };

        if (message.message) {
            activity.type = ActivityTypes.Message;
            activity.text = message.message.text;

            // copy fields like attachments, sticker, quick_reply, nlp, etc.
            for (let key in message.message) {
                activity.channelData[key] = message.message[key];
            }
        } else if (message.postback) {
            activity.type = ActivityTypes.Message;
            activity.text = message.postback.payload;
        }

        const context = new TurnContext(this, activity as Activity);
        await this.runMiddleware(context, logic)
            .catch((err) => { throw err; });
    }

     /*
     * Verifies the SHA1 signature of the raw request payload before bodyParser parses it
     * Will abort parsing if signature is invalid, and pass a generic error to response
     */
    private async verifySignature(req, res) {
        var expected = req.headers['x-hub-signature'];
        var hmac = crypto.createHmac('sha1', this.options.app_secret);
        hmac.update(req.rawBody, 'utf8');
        let calculated = 'sha1=' + hmac.digest('hex');
        if (expected !== calculated) {
            res.status(401);
            debug('Token verification failed, Ignoring message');
            throw new Error('Invalid signature on incoming request');
        } else {
            return true;
        }
    }
}
