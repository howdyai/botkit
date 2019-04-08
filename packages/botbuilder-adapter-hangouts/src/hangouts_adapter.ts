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
    /**
     * Parameters passed to the [Google API client library](https://www.npmjs.com/package/googleapis) which is in turn used to send messages.
     * Define JSON credentials in GOOGLE_CREDS, then pass in {google_auth_params: { credentials: process.env.GOOGLE_CREDS }}
     * OR, specify GOOGLE_APPLICATION_CREDENTIALS in environment [as described in the Google docs](https://cloud.google.com/docs/authentication/getting-started).
     */
    google_auth_params?: {
        credentials?: string,
    };
    /**
     * Shared secret token used to validate the origin of incoming webhooks.
     * Get this from the [Google API console for your bot app](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) - it is found on the Configuration tab under the heading "Verification Token"
     */
    token: string; // webhook validation token
}

/**
 * Connect Botkit or BotBuilder to Google Hangouts.
 * 
 * Use with Botkit:
 *```javascript
 * const adapter = new HangoutsAdapter({
 *  token: process.env.GOOGLE_TOKEN,
 *  google_auth_params: {
 *      credentials: process.env.GOOGLE_CREDS
 *  }
 * });
 * const controller = new Botkit({
 *  adapter: adapter,
 *  // ... other configuration
 * });
 * ```
 * 
 * Use with BotBuilder:
 *```javascript
 * const adapter = new HangoutsAdapter({
 *  token: process.env.GOOGLE_TOKEN,
 *  google_auth_params: {
 *      credentials: process.env.GOOGLE_CREDS
 *  }
 * });
 * // set up restify...
 * const server = restify.createServer();
 * server.post('/api/messages', (req, res) => {
 *  adapter.processActivity(req, res, async(context) => {
 * 
 *      // do your bot logic here!
 * 
 *  });
 * });
 * ```
 */
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

    /**
     * 
     * @param activity 
     */   
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

    /**
     * 
     * @param context 
     * @param activities 
     */
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
                // If there are ever any non-message type events that need to be sent, do it here.
                debug('Unknown message type encountered in sendActivities: ', activity.type);
            }
        }

        return responses;
    }

    /**
     * 
     * @param context 
     * @param activity 
     */
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

                if (!results || results.status != 200) {
                    throw new Error('updateActivity failed: ' + results.statusText);
                }
            } catch (err) {
                console.error('Error updating activity on Hangouts.');
                throw(err);
            }
        } else {
            throw new Error('Cannot update activity: activity is missing id');
        }
    }

    /**
     * 
     * @param context 
     * @param reference 
     */
    public async deleteActivity(context: TurnContext, reference: Partial<ConversationReference>): Promise<void> {
        if (reference.activityId) {
            try {
                const results = await this.api.spaces.messages.delete({
                    name: reference.activityId
                });
                console.log('results of delete',results);

                if (!results || results.status != 200) {
                    throw new Error('deleteActivity failed: ' + results.statusText);
                }
            } catch (err) {
                console.error('Error deleting activity', err);
                throw err;
            }
        } else {
            throw new Error('Cannot delete activity: reference is missing activityId');
        }
    }

    /**
     * 
     * @param reference 
     * @param logic 
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
     * 
     * @param req 
     * @param res 
     * @param logic 
     */
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
