/**
 * @module botbuilder-adapter-web
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity, ActivityTypes, BotAdapter, ConversationReference, TurnContext, ResourceResponse } from 'botbuilder';
import * as Debug from 'debug';
import * as WebSocket from 'ws';
const debug = Debug('botkit:web');

const clients = {};

/**
 * Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to the Web.
 * It offers both websocket and webhook capabilities.
 * To use this adapter, you will need a compatible chat client - generate one using the [Botkit yeoman generator](https://npmjs.com/package/generator-botkit),
 * or use [the one included in the project repo here.](https://github.com/howdyai/botkit/tree/master/packages/botbuilder-adapter-web/client)
 */
export class WebAdapter extends BotAdapter {
    /**
     * Name used to register this adapter with Botkit.
     * @ignore
     */
    public name = 'Web Adapter';

    /**
     * The websocket server.
     */
    public wss;

    private socketServerOptions: {
        [key: string]: any;
    };

    /**
     * Create an adapter to handle incoming messages from a websocket and/or webhook and translate them into a standard format for processing by your bot.
     *
     * To use with Botkit:
     * ```javascript
     * const adapter = new WebAdapter();
     * const controller = new Botkit({
     *      adapter: adapter,
     *      // other options
     * });
     * ```
     *
     * To use with BotBuilder:
     * ```javascript
     * const adapter = new WebAdapter();
     * const server = restify.createServer();
     * server.use(restify.plugins.bodyParser());
     * // instead of binding processActivity to the incoming request, pass in turn handler logic to createSocketServer
     * let options = {}; // socket server configuration options
     * adapter.createSocketServer(server, options, async(context) => {
     *  // handle turn here
     * });
     * ```
     *
     * @param socketServerOptions an optional object containing parameters to send to a call to [WebSocket.server](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback).
     */
    public constructor(socketServerOptions?: {[key: string]: any}) {
        super();
        this.socketServerOptions = socketServerOptions || null;
    }

    /**
     * Botkit-only: Initialization function called automatically when used with Botkit.
     *      * Calls createSocketServer to bind a websocket listener to Botkit's pre-existing webserver.
     * @param botkit
     */
    public init(botkit): void {
        // when the bot is ready, register the webhook subscription with the Webex API
        botkit.ready(() => {
            this.createSocketServer(botkit.http, this.socketServerOptions, botkit.handleTurn.bind(botkit));
        });
    }

    /**
     * Bind a websocket listener to an existing webserver object.
     * Note: Create the server using Node's http.createServer
     * @param server an http server
     * @param socketOptions additional options passed when creating the websocket server with [WebSocket.server](https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback)
     * @param logic a turn handler function in the form `async(context)=>{ ... }` that will handle the bot's logic.
     */
    public createSocketServer(server, socketOptions: any = {}, logic): void {
        this.wss = new WebSocket.Server({
            server,
            ...socketOptions
        });

        function heartbeat(): void {
            this.isAlive = true;
        }

        this.wss.on('connection', (ws) => {
            ws.isAlive = true;
            ws.on('pong', heartbeat);

            ws.on('message', (payload) => {
                try {
                    const message = JSON.parse(payload);

                    // note the websocket connection for this user
                    ws.user = message.user;
                    clients[message.user] = ws;

                    // this stuff normally lives inside Botkit.congfigureWebhookEndpoint
                    const activity = {
                        timestamp: new Date(),
                        channelId: 'websocket',
                        conversation: {
                            id: message.user
                        },
                        from: {
                            id: message.user
                        },
                        recipient: {
                            id: 'bot'
                        },
                        channelData: message,
                        text: message.text,
                        type: message.type === 'message' ? ActivityTypes.Message : ActivityTypes.Event
                    };

                    // set botkit's event type
                    if (activity.type !== ActivityTypes.Message) {
                        activity.channelData.botkitEventType = message.type;
                    }

                    const context = new TurnContext(this, activity as Activity);
                    this.runMiddleware(context, logic)
                        .catch((err) => { console.error(err.toString()); });
                } catch (e) {
                    const alert = [
                        'Error parsing incoming message from websocket.'
                    ];
                    console.error(alert.join('\n'));
                    console.error(e);
                }
            });

            ws.on('error', (err) => console.error('Websocket Error: ', err));

            ws.on('close', function() {
                delete (clients[ws.user]);
            });
        });

        setInterval(() => {
            this.wss.clients.forEach(function each(ws) {
                if (ws.isAlive === false) {
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping('', false, () => {
                    // noop
                });
            });
        }, 30000);
    }

    /**
     * Caste a message to the simple format used by the websocket client
     * @param activity
     * @returns a message ready to send back to the websocket client.
     */
    private activityToMessage(activity: Partial<Activity>): any {
        const message = {
            type: activity.type,
            text: activity.text
        };

        // if channelData is specified, overwrite any fields in message object
        if (activity.channelData) {
            Object.keys(activity.channelData).forEach(function(key) {
                message[key] = activity.channelData[key];
            });
        }

        debug('OUTGOING > ', message);
        return message;
    }

    /**
     * Standard BotBuilder adapter method to send a message from the bot to the messaging API.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#sendactivities).
     * @param context A TurnContext representing the current incoming message and environment. (not used)
     * @param activities An array of outgoing activities to be sent back to the messaging API.
     */
    public async sendActivities(context: TurnContext, activities: Partial<Activity>[]): Promise<ResourceResponse[]> {
        const responses = [];
        for (let a = 0; a < activities.length; a++) {
            const activity = activities[a];

            const message = this.activityToMessage(activity);

            const channel = context.activity.channelId;

            if (channel === 'websocket') {
                // If this turn originated with a websocket message, respond via websocket
                const ws = clients[activity.recipient.id];
                if (ws && ws.readyState === 1) {
                    try {
                        ws.send(JSON.stringify(message));
                    } catch (err) {
                        console.error(err);
                    }
                } else {
                    console.error('Could not send message, no open websocket found');
                }
            } else if (channel === 'webhook') {
                // if this turn originated with a webhook event, enqueue the response to be sent via the http response
                let outbound = context.turnState.get('httpBody');
                if (!outbound) {
                    outbound = [];
                }
                outbound.push(message);
                context.turnState.set('httpBody', outbound);
            }
        }

        return responses;
    }

    /**
     * Web adapter does not support updateActivity.
     * @ignore
     */
    // eslint-disable-next-line
     public async updateActivity(context: TurnContext, activity: Partial<Activity>): Promise<void> {
        debug('Web adapter does not support updateActivity.');
    }

    /**
     * Web adapter does not support updateActivity.
     * @ignore
     */
    // eslint-disable-next-line
     public async deleteActivity(context: TurnContext, reference: Partial<ConversationReference>): Promise<void> {
        debug('Web adapter does not support deleteActivity.');
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
        return this.runMiddleware(context, logic)
            .catch((err) => { console.error(err.toString()); });
    }

    /**
     * Accept an incoming webhook request and convert it into a TurnContext which can be processed by the bot's logic.
     * @param req A request object from Restify or Express
     * @param res A response object from Restify or Express
     * @param logic A bot logic function in the form `async(context) => { ... }`
     */
    public async processActivity(req, res, logic: (context: TurnContext) => Promise<void>): Promise<void> {
        const message = req.body;

        const activity = {
            timestamp: new Date(),
            channelId: 'webhook',
            conversation: {
                id: message.user
            },
            from: {
                id: message.user
            },
            recipient: {
                id: 'bot'
            },
            channelData: message,
            text: message.text,
            type: message.type === 'message' ? ActivityTypes.Message : ActivityTypes.Event
        };

        // set botkit's event type
        if (activity.type !== ActivityTypes.Message) {
            activity.channelData.botkitEventType = message.type;
        }

        // create a conversation reference
        const context = new TurnContext(this, activity as Activity);

        context.turnState.set('httpStatus', 200);

        await this.runMiddleware(context, logic);

        // send http response back
        res.status(context.turnState.get('httpStatus'));
        if (context.turnState.get('httpBody')) {
            res.json(context.turnState.get('httpBody'));
        } else {
            res.end();
        }
    }

    /**
     * Is given user currently connected? Use this to test the websocket connection
     * between the bot and a given user before sending messages,
     * particularly in cases where a long period of time may have passed.
     *
     * Example: `bot.controller.adapter.isConnected(message.user)`
     * @param user the id of a user, typically from `message.user`
     */
    public isConnected(user: string): boolean {
        return typeof clients[user] !== 'undefined';
    }

    /**
     * Returns websocket connection of given user
     * Example: `if (message.action === 'disconnect') bot.controller.adapter.getConnection(message.user).terminate()`
     * @param user
     */
    public getConnection(user: string): WebSocket {
        if (!this.isConnected(user)) {
            throw new Error('User ' + user + ' is not connected');
        }
        return clients[user];
    }
}
