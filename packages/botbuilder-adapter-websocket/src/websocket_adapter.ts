/**
 * @module botbuilder-adapter-websocket
 */

import { Activity, ActivityTypes, BotAdapter, ConversationReference, TurnContext, ResourceResponse } from 'botbuilder';
import * as Debug from 'debug';
import * as WebSocket from 'ws';
const debug = Debug('botkit:websocket');

const clients = {};

/**
 * Create a websocket adapter for Botkit or BotBuilder
 * Requires a compatible chat client - generate one using the Botkit yeoman generator, or find it [here]()
 * # TODO: get links for chat client!
 *
 * To use with Botkit:
 * ```javascript
 * const adapter = new WebsocketAdapter();
 * const controller = new Botkit({
 *      adapter: adapter,
 *      // other options
 * });
 * ```
 *
 * To use with BotBuilder:
 * ```javascript
 * const adapter = new WebsocketAdapter();
 * const server = restify.createServer();
 * // instead of binding processActivity to the incoming request, pass in turn handler logic to createWebSocketServer
 * adapter.createWebSocketServer(server, async(context) => {
 *  // handle turn here
 * });
 * ```
 */
export class WebsocketAdapter extends BotAdapter {
    /**
     * Name used to register this adapter with Botkit.
     */
    public name: string = 'Websocket Adapter';

    /**
     * The websocket server.
     */
    public wss;

    /**
     * Create a new websocket adapter. No parameters required, though Botkit must have a fully configured
     */
    public constructor() {
        super();
    }

    /**
     * Called automatically when Botkit uses this adapter - calls createSocketServer and binds a websocket listener to Botkit's pre-existing webserver.
     * @param botkit
     */
    public init(botkit): void {
        // when the bot is ready, register the webhook subscription with the Webex API
        botkit.ready(() => {
            this.createSocketServer(botkit.http, botkit.handleTurn.bind(botkit));
        });
    }

    /**
     * Bind a websocket listener to an existing webserver object.
     * Note: Create the server using Node's http.createServer - NOT an Express or Restify object.
     * @param server an http server
     */
    public createSocketServer(server, logic): void {
        this.wss = new WebSocket.Server({
            server
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
                        conversation: { id: message.user },
                        from: { id: message.user },
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
                    var alert = [
                        `Error parsing incoming message from websocket.`,
                        `Message must be JSON, and should be in the format documented here:`,
                        `https://botkit.ai/docs/readme-web.html#message-objects`
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
                ws.ping('', false, true);
            });
        }, 30000);
    }

    /**
     * Caste a message to the simple format used by the websocket client
     * @param activity 
     * @returns a message ready to send back to the websocket client.
     */
    private activityToMessage(activity: Partial<Activity>): any {

        let message = {
            type: activity.type,
            text: activity.text,
        }

        // if channelData is specified, overwrite any fields in message object
        if (activity.channelData) {
            Object.keys(activity.channelData).forEach(function(key) {
                message[key] = activity.channelData[key];
            });
        }

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
        for (var a = 0; a < activities.length; a++) {

            const activity = activities[a];
            
            let message = this.activityToMessage(activity);
            console.log('Outgoing message', message);
            console.log('CONTEXT CHANNEL:', context.activity.channelId);
            const channel = context.activity.channelId;

            if (channel === 'websocket') {
                // If this turn originated with a websocket message, respond via websocket
                var ws = clients[activity.recipient.id];
                if (ws) {
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
     * Websocket adapter does not support updateActivity.
     */
    public async updateActivity(context: TurnContext, activity: Partial<Activity>): Promise<void> {
        debug('Websocket adapter does not support updateActivity.');
    }


    /**
     * Websocket adapter does not support updateActivity.
     */
    public async deleteActivity(context: TurnContext, reference: Partial<ConversationReference>): Promise<void> {
        debug('Websocket adapter does not support deleteActivity.');
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

        console.log('CALLED CONTINUE CONVERSATION');

        return this.runMiddleware(context, logic)
            .catch((err) => { console.error(err.toString()); });
    }

    /**
     * Accept an incoming webhook request and convert it into a TurnContext which can be processed by the bot's logic.
     * @param req A request object from Restify or Express
     * @param res A response object from Restify or Express
     * @param logic A bot logic function in the form `async(context) => { ... }`
     */
    // TODO: update this to actually work with webhooks, and to queue up responses and send them back as a batch
    public async processActivity(req, res, logic: (context: TurnContext) => Promise<void>): Promise<void> {
        const message = req.body;

        console.log('INCOMING ACTIVITY VIA WEBHOOK', message);

        // this stuff normally lives inside Botkit.congfigureWebhookEndpoint
        const activity: Activity = {
            timestamp: new Date(),
            channelId: 'webhook',
            //@ts-ignore
            conversation: { id: message.user },
            //@ts-ignore
            from: { id: message.user },
            channelData: message,
            text: message.text,
            type: message.type === 'message' ? ActivityTypes.Message : ActivityTypes.Event
        };

        // set botkit's event type
        if (activity.type !== ActivityTypes.Message) {
            activity.channelData.botkitEventType = message.type;
        }

        // create a conversation reference
        const context = new TurnContext(this, activity);

        context.turnState.set('httpStatus', 200);

        await this.runMiddleware(context, logic)
            .catch((err) => { throw err; });

        // send http response back
        res.status(context.turnState.get('httpStatus'));
        if (context.turnState.get('httpBody')) {
            res.json(context.turnState.get('httpBody'));
        } else {
            res.end();
        }
    }
}
