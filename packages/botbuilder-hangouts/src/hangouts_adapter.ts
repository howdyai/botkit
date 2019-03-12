import { Activity, ActivityTypes, BotAdapter, TurnContext, ConversationReference } from 'botbuilder';
import * as Debug from 'debug';
import { google } from 'googleapis';
import { HangoutsBotWorker } from './botworker';
const debug = Debug('botkit:hangouts');

const apiVersion = 'v1';

export interface HangoutsAdapterOptions {
    google_auth_params: any;
    token: string; // webhook validation token
}

export class HangoutsAdapter extends BotAdapter {
    // Botkit Plugin fields
    public name: string;
    public middlewares;
    public web;
    public menu;
    private options: HangoutsAdapterOptions;
    private api; // google api

    // tell botkit to use this type of worker
    public botkit_worker = HangoutsBotWorker;

    // TODO: Define options
    constructor(options: HangoutsAdapterOptions) {
        super();

        this.options = options;

        this.name = 'Google Hangouts Adapter';

        let params = {
            scopes: 'https://www.googleapis.com/auth/chat.bot',
            ...this.options.google_auth_params
        };

        
        google
            .auth
            .getClient(params)
            .then(client => {
                this.api = google.chat({version: apiVersion, auth: client});
            })
            .catch(err => {
                console.error('Could not get google auth client !');
                throw new Error(err);
            });

        this.middlewares = {
            spawn: [
                async (bot, next) => {

                    bot.api = this.api;
                    next();

                }
            ]
        };

        this.web = [];

        this.menu = [];
    }

    private activityToHangouts(activity: any): any {

        const message = {
            parent: activity.conversation.id,
            threadKey: activity.conversation.threadKey || null,
            requestBody: { 
                text: activity.text,
                thread: activity.conversation.thread ? { name: activity.conversation.thread } : null
            },
        };

        // if channelData is specified, overwrite any fields in message object
        if (activity.channelData) {
            Object.keys(activity.channelData).forEach(function(key) {
                message.requestBody[key] = activity.channelData[key];
            });
        }

        console.log('OUTBOUND TO HANGOUTS', message);

        return message;
    }

    public async sendActivities(context: TurnContext, activities: Activity[]) {
        const responses = [];
        for (var a = 0; a < activities.length; a++) {
            const activity = activities[a];
            if (activity.type === ActivityTypes.Message) {
                const message = this.activityToHangouts(activity);
                try {
                    responses.push(await this.api.spaces.messages.create(message));
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
        if (activity.id && activity.conversation) {
            try {
                // const message = this.activityToSlack(activity);

                // // set the id of the message to be updated
                // message.ts = activity.id;
                // const slack = await this.getAPI(activity);
                // const results = await slack.chat.update(message);
                // if (!results.ok) {
                //     console.error('Error updating activity on Slack:', results);
                // }
            } catch (err) {
                console.error('Error updating activity on Slack:', err);
            }
        } else {
            throw new Error('Cannot update activity: activity is missing id');
        }
    }

    async deleteActivity(context: TurnContext, reference: ConversationReference) {
        if (reference.activityId && reference.conversation) {
            try {
                // const slack = await this.getAPI(context.activity);
                // const results = await slack.chat.delete({ ts: reference.activityId, channel: reference.conversation.id });
                // if (!results.ok) {
                //     console.error('Error deleting activity:', results);
                // }
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

        console.log('GOOGLE EVENT:', event);

        if (this.options.token && this.options.token !== event.token) {
            res.status(401);
            debug('Token verification failed, Ignoring message');
        } else {
            const activity = {
                id: event.message ? event.message.name : event.eventTime,
                timestamp: new Date(),
                channelId: 'googlehangouts',
                conversation: {
                    id: event.space.name,
                    thread: (event.message && !event.threadKey) ? event.message.thread.name : null,
                    threadKey: event.threadKey ||  null
                },
                from: {
                    id: event.user.name
                }, 
                channelData: event,
                text: event.message ? (event.message.argumentText ? event.message.argumentText.trim() : '') : '',
                type: event.message ? ActivityTypes.Message : ActivityTypes.Event
            };

            // change type of message event for private messages
            if (event.space.type === 'DM') {
                activity.channelData.botkitEventType = 'direct_message';
            }

            if ('ADDED_TO_SPACE' === event.type) {
                activity.channelData.botkitEventType = 'ROOM' === event.space.type ? 'bot_room_join' : 'bot_dm_join';
            }
    
            if ('REMOVED_FROM_SPACE' === event.type) {
                activity.channelData.botkitEventType = 'ROOM' === event.space.type ? 'bot_room_leave' : 'bot_dm_leave';
            }
    
            if ('CARD_CLICKED' === event.type) {
                activity.channelData.botkitEventType = event.type.toLowerCase();
            }

            // create a conversation reference
            // @ts-ignore
            const context = new TurnContext(this, activity as Activity);

            if (event.type !== 'CARD_CLICKED') {
                // send 200 status immediately, otherwise 
                // hangouts does not mark the incoming message as received
                res.status(200);
                res.end();
            } else {
                context.turnState.set('httpStatus', 200);
            }

            await this.runMiddleware(context, logic)
                .catch((err) => { throw err; });

            if (event.type === 'CARD_CLICKED') {
                // send http response back
                res.status(context.turnState.get('httpStatus'));
                if (context.turnState.get('httpBody')) {
                    console.log('sENDING BODY', context.turnState.get('httpBody'));
                    res.send(context.turnState.get('httpBody'));
                } else {
                    res.end();
                }
            }
        }
    }
}
