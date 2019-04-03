/**
 * @module botbuilder-adapter-facebook
 */

 import { Activity, ActivityTypes, BotAdapter, TurnContext, ConversationReference } from 'botbuilder';
import * as Debug from 'debug';
import { FacebookBotWorker } from './botworker';
import { FacebookAPI } from './facebook_api';
const debug = Debug('botkit:facebook');


export interface FacebookAdapterOptions {
    api_host?: string;
    verify_token: string;
    app_secret: string;
    access_token: string;
}

export class FacebookAdapter extends BotAdapter {
    // Botkit Plugin fields
    public name: string;
    public middlewares;
    public web;
    public menu;
    private options: FacebookAdapterOptions;
    private api; // google api

    // tell botkit to use this type of worker
    public botkit_worker = FacebookBotWorker;

    private api_version: string = 'v2.11';
    private api_host: string = 'graph.facebook.com';

    // TODO: Define options
    constructor(options: FacebookAdapterOptions) {
        super();

        this.options = options;

        if (this.options.api_host) {
            this.api_host = this.options.api_host;
        }

        this.name = 'Facebook Adapter';

        this.middlewares = {
            spawn: [
                async (bot, next) => {

                    bot.api = this.api;
                    next();

                }
            ]
        };

        this.web = [
            {
                method: 'get',
                url: '/api/messages', // TODO: CAN THIS USE CONTROLLER CONFIG?
                handler: (req, res) => {
                    if (req.query['hub.mode'] == 'subscribe') {
                        if (req.query['hub.verify_token'] == this.options.verify_token) {
                            res.send(req.query['hub.challenge']);
                        } else {
                            res.send('OK');
                        }
                    }
                }
            }
        ];

        this.menu = [];
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
                quick_replies: undefined,
            },
            messaging_type: 'RESPONSE',
            tag: undefined,
            notification_type: undefined,
            persona_id: undefined,
            sender_action: undefined,
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
                    var quick_reply = {...item};
                    if (!item.content_type) quick_reply.content_type = 'text';
                    return quick_reply;
                });
            }
        }

        debug('OUT TO FACEBOOK > ', message);

        return message;
    }

    public async sendActivities(context: TurnContext, activities: Activity[]) {
        const responses = [];
        for (var a = 0; a < activities.length; a++) {
            const activity = activities[a];
            if (activity.type === ActivityTypes.Message) {
                const message = this.activityToFacebook(activity);
                try {
                    // TODO: accessor function to allow multi-tenant
                    message.access_token = this.options.access_token;
                    
                    var api = new FacebookAPI(this.options.access_token);
                    const res = await api.callAPI('/me/messages', 'POST', message);
                    responses.push({ id: res.message_id });
                    debug('RESPONSE FROM FACEBOOK > ', res);
                } catch (err) {
                    console.error('Error sending activity to Slack:', err);
                }
            } else {
                // TODO: Handle sending of other types of message?
            }
        }

        return responses;
    }

    async updateActivity(context: TurnContext, activity: Activity) {
        if (activity.id) {
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

    async deleteActivity(context: TurnContext, reference: ConversationReference) {
        if (reference.activityId) {
            try {

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

    async continueConversation(reference: ConversationReference, logic: (t: TurnContext) => Promise<any>) {
        const request = TurnContext.applyConversationReference(
            { type: 'event', name: 'continueConversation' },
            reference,
            true
        );
        const context = new TurnContext(this, request);

        return this.runMiddleware(context, logic);
    }

    async processActivity(req, res, logic) {
        let event = req.body;

        debug('IN FROM FACEBOOK >', event);

        if (false) {
            res.status(401);
            debug('Token verification failed, Ignoring message');
        } else if (event.entry) {

            for (var e = 0; e < event.entry.length; e++) {
                let payload = null;
                let entry = event.entry[e];
                
                // handle normal incoming stuff
                if (entry.changes) {
                    payload = entry.changes;
                } else if (entry.messaging) {
                    payload = entry.messaging;
                }

                for (var m = 0; m < payload.length; m++) {
                    await this.processSingleMessage(payload[m], logic);
                }

                // handle standby messages (this bot is not the active receiver)
                if (entry.standby) {
                    payload = entry.standyby;


                    for (var m = 0; m < payload.length; m++) {
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

    async processSingleMessage(message: any, logic: any) {

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
                name:message.sender.id
            },
            recipient: {
                id: message.recipient.id
            },
            channelData: message,
            type: ActivityTypes.Event,
            text: null,
        }

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

}