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
    public name: string;

    /**
     * The websocket server.
     */
    public wss;

    /**
     * Create a new websocket adapter. No parameters required, though Botkit must have a fully configured
     */
    public constructor() {
        super();

        // Botkit Plugin additions
        this.name = 'Websocket Adapter';
    }

    /**
     * Called automatically when Botkit uses this adapter - calls createSocketServer and binds a websocket listener to Botkit's pre-existing webserver.
     * @param botkit
     */
    public init(botkit): void {
        // when the bot is ready, register the webhook subscription with the Webex API
        botkit.ready(() => {
            this.createSocketServer(botkit.http, botkit.handleTurn);
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
                        conversation: { id: message.channel },
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
     * Standard BotBuilder adapter method to send a message from the bot to the messaging API.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#sendactivities).
     * @param context A TurnContext representing the current incoming message and environment. (not used)
     * @param activities An array of outgoing activities to be sent back to the messaging API.
     */
    public async sendActivities(context: TurnContext, activities: Partial<Activity>[]): Promise<ResourceResponse[]> {
        const responses = [];
        for (var a = 0; a < activities.length; a++) {

            // TODO: We need to caste the activity into the right format... 
            // TODO: OR update the client to deal in activities...
            const activity = activities[a];
            var ws = clients[activity.recipient.id];
            if (ws) {
                try {
                    ws.send(JSON.stringify(activity));
                } catch (err) {
                    console.error(err);
                }
            } else {
                console.error('Could not send message, no open websocket found');
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
        const activity = req.body;

        // create a conversation reference
        const context = new TurnContext(this, activity);

        context.turnState.set('httpStatus', 200);

        await this.runMiddleware(context, logic)
            .catch((err) => { throw err; });

        // send http response back
        res.status(context.turnState.get('httpStatus'));
        if (context.turnState.get('httpBody')) {
            res.send(context.turnState.get('httpBody'));
        } else {
            res.end();
        }
    }
}
