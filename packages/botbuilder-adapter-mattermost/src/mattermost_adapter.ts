/**
 * @module botbuilder-adapter-mattermost
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity, ActivityTypes, BotAdapter, TurnContext, ConversationReference, ResourceResponse } from 'botbuilder';
import * as fetch from 'node-fetch';
import * as WebSocket from 'ws';
import * as Debug from 'debug';
import { URL } from 'url';

const debug = Debug('botkit:mattermost');

export class MattermostAdapter extends BotAdapter {

    public name = 'Mattermost Adapter';

    private apiUrl: string;

    private websocketUrl: string;

    private botToken: string;

    private user: any;

    private socket: WebSocket;

    readonly botkitDependency = 'mattermost_adapter::websocket';

    readonly postsPath = '/posts';

    readonly mePath = '/users/me';

    /**
     * Create a Mattermost adapter.
     * 
     * [Read here for more information about all the ways to configure the MattermostAdapter &rarr;](../../botbuilder-adapter-mattermost/readme.md).
     * 
     * Use with Botkit:
     * ```javascript
     * const adapter = new MattermostAdapter({
     *     host: process.env.MATTERMOST_HOST,
     *     port: process.env.MATTERMOST_PORT,
     *     botToken: process.env.MATTERMOST_TOKEN
     * });
     * const controller = new Botkit({
     *     adapter: adapter,
     *     // ... other configuration options
     * });
     * ```
     * 
     * Use with BotBuilder:
     * ```javascript
     * const adapter = new MattermostAdapter({
     *     host: process.env.MATTERMOST_HOST,
     *     port: process.env.MATTERMOST_PORT,
     *     botToken: process.env.MATTERMOST_TOKEN
     * });
     * // set up restify...
     * const server = restify.createServer();
     * server.use(restify.plugins.bodyParser());
     * adapter.connectMattermost(async(context) => {
     *  // handle turn here
     * });
     * ```
     *
     * @param options An object containing Mattermost's URL, API credentials and other options
     */
    public constructor(options: MattermostAdapterOptions) {
        super();

        if (!options.url && !options.botToken) {
            throw new Error('Incomplete Mattermost configuration');
        }

        const url = new URL(options.url);

        if (!(url.protocol === 'http:' || url.protocol === 'https:')) {
            throw new Error('Invalid Mattermost URL');
        }

        this.apiUrl = `${url.protocol}//${url.host}/api/v4`
        this.websocketUrl = `${url.protocol === 'http:' ? 'ws' : 'wss'}://${url.host}/api/v4/websocket`
        this.botToken = options.botToken;
    }

    /**
     * Botkit-only: Initialization function called automatically when used with Botkit.
     *      * Calls connectMattermost to connect to the Mattermost WebSocket API.
     * @param botkit
     */
    public async init(botkit): Promise<void> {
        botkit.addDep(this.botkitDependency);

        const logic = botkit.handleTurn.bind(botkit);
        const completeDep = () => botkit.completeDep(this.botkitDependency);

        this.connectMattermost(logic, completeDep);
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
                const message = this.activityToMattermost(activity);

                try {
                    const res = await fetch(`${this.apiUrl}${this.postsPath}`, {
                        method: 'post',
                        headers: {
                            Authorization: `Bearer ${this.botToken}`
                        },
                        body: JSON.stringify(message)
                    });
                    const result = await res.json();

                    if (res.status === 201) {
                        responses.push({
                            id: result.id,
                            activityId: result.id,
                            conversation: { id: result.channel_id }
                        });
                    } else {
                        console.error('Error sending activity to API: ', result);
                    }
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
     * @param context A TurnContext representing the current incoming message and environment.
     * @param activity The updated activity in the form `{id: <id of activity to update>, ...}`
     */
    public async updateActivity(context: TurnContext, activity: Partial<Activity>): Promise<void> {
        if (activity.id && activity.conversation) {
            try {
                const message = this.activityToMattermost(activity);
                const res = await fetch(`${this.apiUrl}${this.postsPath}/${activity.id}`, {
                    method: 'put',
                    headers: {
                        Authorization: `Bearer ${this.botToken}`
                    },
                    body: JSON.stringify(message)
                });

                if (res !== 200) {
                    const error = await res.json();

                    console.error('Error updating activity on Slack:', error);
                }
            } catch (err) {
                console.error('Error updating activity on Slack:', err);
            }
        } else {
            throw new Error('Cannot update activity: activity is missing id');
        }
    }

    /**
     * Standard BotBuilder adapter method to delete a previous message.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#deleteactivity).
     * @param context A TurnContext representing the current incoming message and environment.
     * @param reference An object in the form `{activityId: <id of message to delete>, conversation: { id: <id of slack channel>}}`
     */
    public async deleteActivity(context: TurnContext, reference: Partial<ConversationReference>): Promise<void> {
        if (reference.activityId && reference.conversation) {
            try {
                const res = await fetch(`${this.apiUrl}${this.postsPath}/${reference.activityId}`, {
                    method: 'delete',
                    headers: {
                        Authorization: `Bearer ${this.botToken}`
                    }
                });

                if (res !== 200) {
                    const error = await res.json();

                    console.error('Error deleting activity:', error);
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
    public async continueConversation(reference: Partial<ConversationReference>, logic: (revocableContext: TurnContext) => Promise<void>): Promise<void> {
        const request = TurnContext.applyConversationReference(
            { type: 'event', name: 'continueConversation' },
            reference,
            true
        );
        const context = new TurnContext(this, request);

        return this.runMiddleware(context, logic);
    }

    /**
     * Connect to the Mattermost WebSocket API.
     * @param logic a turn handler function in the form `async(context)=>{ ... }` that will handle the bot's logic.
     * @param onConnect a callback function in the form `()=>{ ... }` that will be invoked when the WebSocket connection has ben established.
     */
    public async connectMattermost(logic: (context: TurnContext) => Promise<void>, onConnect?: () => any): Promise<void> {
        try {
            await this.login();
            await this.connect(logic, onConnect);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    }

    private async login(): Promise<void> {
        const res = await fetch(`${this.apiUrl}${this.mePath}`, {
            headers: {
                Authorization: `Bearer ${this.botToken}`
            }
        });

        if (res.status === 200) {
            this.user = await res.json();

            return;
        }

        throw new Error('Could not log-in to Mattermost.');
    }

    private async connect(logic: (context: TurnContext) => Promise<void>, onConnect?: () => any): Promise<void> {
        this.socket = new WebSocket(this.websocketUrl);

        this.socket.on('open', async () => {
            await this.authenticateWebsocket();
            onConnect();
        });
        this.socket.on('message', data => this.handleWebsocketMessage(data, logic));
        this.socket.on('error', (err) => console.error('Websocket Error: ', err));
        this.socket.on('close', () => {
            console.log('Mattermost WebSocket has been closed');

            this.connect(logic);
        });
        this.socket.on('ping', function () {
            this.pong();
        });

        const interval = setInterval(() => {
            this.socket.ping((error: Error) => {
                if (error !== undefined) {
                    clearInterval(interval);
                    this.connect(logic);
                }
            });
        }, 30000);
    }

    private async authenticateWebsocket(): Promise<void> {
        const authenticationPayload = {
            seq: 1,
            action: 'authentication_challenge',
            data: {
                token: this.botToken
            }
        };

        return new Promise((resolve, reject) => {
            this.socket.send(JSON.stringify(authenticationPayload), e => reject(e));
            resolve();
        });
    }

    private async handleWebsocketMessage(data: WebSocket.Data, logic: (context: TurnContext) => Promise<void>): Promise<void> {
        const message = JSON.parse(data.toString());

        if (message.event === 'posted') {
            message.data.post = JSON.parse(message.data.post);

            if (message.data.post.user_id === this.user.id) {
                return;
            }

            const activity = {
                timestamp: new Date(message.data.post.create_at),
                channelId: 'mattermost',
                conversation: {
                    id: message.data.post.channel_id
                },
                from: {
                    id: message.data.post.user_id,
                    name: message.data.sender_name
                },
                channelData: message.data,
                text: message.data.post.message,
                type: ActivityTypes.Message
            };

            const context = new TurnContext(this, activity as Activity);

            await this.runMiddleware(context, logic);
        }
    }

    private activityToMattermost(activity: Partial<Activity>): any {
        const message = {
            channel_id: activity.conversation.id,
            message: activity.text
        };

        // if channelData is specified, overwrite any fields in message object
        if (activity.channelData) {
            Object.keys(activity.channelData).forEach(function (key) {
                message[key] = activity.channelData[key];
            });
        }

        debug('OUTGOING > ', message);

        return message;
    }

}

export interface MattermostAdapterOptions {

    url: string;

    insecure?: boolean;

    botToken: string;

}
