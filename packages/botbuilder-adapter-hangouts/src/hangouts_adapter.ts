/**
 * @module botbuilder-adapter-hangouts
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity, ActivityTypes, BotAdapter, TurnContext, ConversationReference, ResourceResponse } from 'botbuilder';
import * as Debug from 'debug';
import { google } from 'googleapis';
import { HangoutsBotWorker } from './botworker';
import { RequestValidator } from './request_validator';
const debug = Debug('botkit:hangouts');

const apiVersion = 'v1';

/**
 * Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Google Hangouts
 *
 */
export class HangoutsAdapter extends BotAdapter {
    /**
     * Name used by Botkit plugin loader
     * @ignore
     */
    public name = 'Google Hangouts Adapter';

    /**
     * Object containing one or more Botkit middlewares to bind automatically.
     * @ignore
     */
    public middlewares;

    /**
     * A customized BotWorker object that exposes additional utility methods.
     * @ignore
     */
    public botkit_worker = HangoutsBotWorker;

    /**
     * Location of configuration options.
     */
    private options: HangoutsAdapterOptions;

    /**
     * A copy of the Google Chat client.
     */
    private api: any;

    /**
     * A utility to validate requests received by the hanouts adapter.
     */
    private requestValidator: RequestValidator;

    /**
     * Create an adapter to handle incoming messages from Google Hangouts and translate them into a standard format for processing by your bot.
     *
     * Use with Botkit:
     *```javascript
     * const adapter = new HangoutsAdapter({
     *      project_number: process.env.GOOGLE_PROJECT_NUMBER,
     *      google_auth_params: {
     *          credentials: process.env.GOOGLE_CREDS
     *      }
     * });
     * const controller = new Botkit({
     *      adapter: adapter,
     *      // ... other configuration options
     * });
     * ```
     *
     * Use with BotBuilder:
     *```javascript
     * const adapter = new HangoutsAdapter({
     *      project_number: process.env.GOOGLE_PROJECT_NUMBER,
     *      google_auth_params: {
     *          credentials: process.env.GOOGLE_CREDS
     *      }
     * });
     * // set up restify...
     * const server = restify.createServer();
     * server.use(restify.plugins.bodyParser());
     * server.post('/api/messages', (req, res) => {
     *      adapter.processActivity(req, res, async(context) => {
     *          // do your bot logic here!
     *      });
     * });
     * ```
     *
     * @param options An object containing API credentials
     */
    public constructor(options: HangoutsAdapterOptions) {
        super();

        this.options = options;
        this.requestValidator = new RequestValidator();

        const params = {
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
                if (!this.options.enable_incomplete) {
                    throw new Error(err);
                }
            });

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
                    bot.api = this.api;
                    next();
                }
            ]
        };
    }

    /**
     * Formats a BotBuilder activity into an outgoing Hangouts event.
     * @param activity A BotBuilder Activity object
     */
    private activityToHangouts(activity: Activity): any {
        const message = {
            parent: activity.conversation.id,
            // @ts-ignore Ignore the presence of this unofficial field
            threadKey: activity.conversation.threadKey || null,
            requestBody: {
                text: activity.text,
                // @ts-ignore Ignore the presence of this unofficial field
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
     * Standard BotBuilder adapter method to send a message from the bot to the messaging API.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#sendactivities).
     * @param context A TurnContext representing the current incoming message and environment. (Not used)
     * @param activities An array of outgoing activities to be sent back to the messaging API.
     */
    public async sendActivities(context: TurnContext, activities: Partial<Activity>[]): Promise<ResourceResponse[]> {
        const responses = [];
        for (let a = 0; a < activities.length; a++) {
            const activity = activities[a] as Activity;
            if (activity.type === ActivityTypes.Message) {
                const message = this.activityToHangouts(activity);
                try {
                    const res = await this.api.spaces.messages.create(message);
                    responses.push({ id: res.data.name });
                } catch (err) {
                    console.error('Error sending activity to API:', err);
                }
            } else {
                // If there are ever any non-message type events that need to be sent, do it here.
                debug('Unknown message type encountered in sendActivities: ', activity.type);
            }
        }

        return responses;
    }

    /**
     * Standard BotBuilder adapter method to update a previous message with new content.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#updateactivity).
     * @param context A TurnContext representing the current incoming message and environment. (Not used)
     * @param activity The updated activity in the form `{id: <id of activity to update>, text: <updated text>, cards?: [<array of updated hangouts cards>]}`
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

                if (!results || results.status !== 200) {
                    throw new Error('updateActivity failed: ' + results.statusText);
                }
            } catch (err) {
                console.error('Error updating activity on Hangouts.');
                throw (err);
            }
        } else {
            throw new Error('Cannot update activity: activity is missing id');
        }
    }

    /**
     * Standard BotBuilder adapter method to delete a previous message.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#deleteactivity).
     * @param context A TurnContext representing the current incoming message and environment. (Not used)
     * @param reference An object in the form `{activityId: <id of message to delete>}`
     */
    public async deleteActivity(context: TurnContext, reference: Partial<ConversationReference>): Promise<void> {
        if (reference.activityId) {
            try {
                const results = await this.api.spaces.messages.delete({
                    name: reference.activityId
                });
                if (!results || results.status !== 200) {
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
        const event = req.body;

        debug('IN FROM HANGOUTS >', event);

        if (!(await this.requestValidator.isValid(req, this.options.project_number))) {
            res.status(401);
            debug('Token verification failed, Ignoring message');
        } else {
            const activity: Activity = {
                id: event.message ? event.message.name : event.eventTime,
                timestamp: new Date(),
                channelId: 'googlehangouts',
                conversation: {
                    id: event.space.name,
                    // @ts-ignore
                    thread: (event.message && !event.threadKey) ? event.message.thread.name : null,
                    // @ts-ignore
                    threadKey: event.threadKey || null
                },
                from: {
                    id: event.user.name,
                    name: event.user.name
                },
                channelData: event,
                text: event.message ? (event.message.argumentText ? event.message.argumentText.trim() : '') : '',
                type: event.message ? ActivityTypes.Message : ActivityTypes.Event
            };

            // Change type of message event for private messages
            if (event.space.type === 'DM') {
                activity.channelData.botkitEventType = 'direct_message';
            }

            if (event.type === 'ADDED_TO_SPACE') {
                activity.type = ActivityTypes.Event;
                activity.channelData.botkitEventType = event.space.type === 'ROOM' ? 'bot_room_join' : 'bot_dm_join';
            }

            if (event.type === 'REMOVED_FROM_SPACE') {
                activity.type = ActivityTypes.Event;
                activity.channelData.botkitEventType = event.space.type === 'ROOM' ? 'bot_room_leave' : 'bot_dm_leave';
            }

            if (event.type === 'CARD_CLICKED') {
                activity.type = ActivityTypes.Event;
                activity.channelData.botkitEventType = event.type.toLowerCase();
            }

            // create a conversation reference
            const context = new TurnContext(this, activity);

            if (event.type !== 'CARD_CLICKED') {
                // send 200 status immediately, otherwise
                // hangouts does not mark the incoming message as received
                res.status(200);
                res.end();
            } else {
                context.turnState.set('httpStatus', 200);
            }

            await this.runMiddleware(context, logic);

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

export interface HangoutsAdapterOptions {
    /**
     * Parameters passed to the [Google API client library](https://www.npmjs.com/package/googleapis) which is in turn used to send messages.
     * Define credentials per [the GoogleAuthOptions defined here](https://github.com/googleapis/google-auth-library-nodejs/blob/master/src/auth/googleauth.ts#L54),
     * OR, specify GOOGLE_APPLICATION_CREDENTIALS in environment [as described in the Google docs](https://cloud.google.com/docs/authentication/getting-started).
     */
    google_auth_params?: {
        client_email?: string;
        private_key?: string;
    };

    /**
     * ProjectId to verify the audience of the bearer token, also referenced as the project number of the bot.
     * Get this from the [Google Cloud Platform Dashboard for your bot](https://console.cloud.google.com/home/dashboard) - it is found under the heading "Project number".
     */
    project_number: string;

    /**
     * Allow the adapter to startup without a complete configuration.
     * This is risky as it may result in a non-functioning or insecure adapter.
     * This should only be used when getting started.
     */
    enable_incomplete?: boolean;

}
