/**
 * @module botbuilder-adapter-hangouts
 */
import { Activity, ActivityTypes, BotAdapter, TurnContext, ConversationReference, ResourceResponse } from 'botbuilder';
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
    private options: HangoutsAdapterOptions;
    private api; // google api

    // tell botkit to use this type of worker
    public botkit_worker = HangoutsBotWorker;

    public constructor(options: HangoutsAdapterOptions) {
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
                this.api = google.chat({ version: apiVersion, auth: client });
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
    }

    private activityToHangouts(activity: any): any {
        const message = {
            parent: activity.conversation.id,
            threadKey: activity.conversation.threadKey || null,
            requestBody: {
                text: activity.text,
                thread: activity.conversation.thread ? { name: activity.conversation.thread } : null
            }
        };

        // if channelData is specified, overwrite any fields in message object
        if (activity.channelData) {
            Object.keys(activity.channelData).forEach(function(key) {
                message.requestBody[key] = activity.channelData[key];
            });
        }

        debug('OUT TO HANGOUTS > ', message);

        return message;
    }

    public async sendActivities(context: TurnContext, activities: Partial<Activity>[]): Promise<ResourceResponse[]> {
        const responses = [];
        for (var a = 0; a < activities.length; a++) {
            const activity = activities[a];
            if (activity.type === ActivityTypes.Message) {
                const message = this.activityToHangouts(activity);
                try {
                    const res = await this.api.spaces.messages.create(message);
                    responses.push({ id: res.data.name });
                } catch (err) {
                    console.error('Error sending activity to Slack:', err);
                }
            } else {
                // TODO: Handle sending of other types of message?
            }
        }

        return responses;
    }

    public async updateActivity(context: TurnContext, activity: Partial<Activity>): Promise<void> {
        if (activity.id) {
            try {
                const results = await this.api.spaces.messages.update({
                    name: activity.id,
                    updateMask: 'text,cards',
                    resource: {
                        text: activity.text,
                        // @ts-ignore allow cards field
                        cards: activity.cards ? activity.cards : (activity.channelData ? activity.channelData.cards : null)
                    }
                });

                if (!results) {
                    throw new Error('API call failed with no results');
                }
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
                const results = await this.api.spaces.messages.delete({
                    name: reference.activityId
                });

                if (!results) {
                    throw new Error('API call failed with no results');
                }
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
        let event = req.body;

        debug('IN FROM HANGOUTS >', event);

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
                    threadKey: event.threadKey || null
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

            if (event.type === 'ADDED_TO_SPACE') {
                activity.channelData.botkitEventType = event.space.type === 'ROOM' ? 'bot_room_join' : 'bot_dm_join';
            }

            if (event.type === 'REMOVED_FROM_SPACE') {
                activity.channelData.botkitEventType = event.space.type === 'ROOM' ? 'bot_room_leave' : 'bot_dm_leave';
            }

            if (event.type === 'CARD_CLICKED') {
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
                    res.send(context.turnState.get('httpBody'));
                } else {
                    res.end();
                }
            }
        }
    }
}
