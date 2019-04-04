/**
 * @module botbuilder-adapter-websocket
 */

 import { Activity, ActivityTypes, BotAdapter, TurnContext } from 'botbuilder';
import * as Debug from 'debug';
var WebSocket = require('ws');
const debug = Debug('botkit:websocket');

const clients = {};

export class WebsocketAdapter extends BotAdapter {
    public name: string;
    public web;
    public menu;

    public wss;

    constructor() {
        super();

        // Botkit Plugin additions
        this.name = 'Websocket Adapter';

    }

    // Botkit init function, called only when used alongside Botkit
    public init(botkit) {

        // when the bot is ready, register the webhook subscription with the Webex API
        botkit.ready(() => {
            let server = botkit.http;
            this.wss = new WebSocket.Server({
                server
            });

            function heartbeat() {
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
                        this.runMiddleware(context, async (context) => { return botkit.handleTurn(context); })
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
        });
    }

    async sendActivities(context, activities) {
        const responses = [];
        for (var a = 0; a < activities.length; a++) {
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

    async updateActivity(context, activity) {
        debug('Websocket adapter does not support updateActivity.');
    }

    async deleteActivity(context, reference) {
        debug('Websocket adapter does not support deleteActivity.');
    }

    async continueConversation(reference, logic) {
        const request = TurnContext.applyConversationReference(
            { type: 'event', name: 'continueConversation' },
            reference,
            true
        );
        const context = new TurnContext(this, request);

        return this.runMiddleware(context, logic)
            .catch((err) => { console.error(err.toString()); });
    }

    async processActivity(req, res, logic) {
        res.status(200);
        res.end();

        const activity = req.body;

        // create a conversation reference
        const context = new TurnContext(this, activity);

        this.runMiddleware(context, logic)
            .catch((err) => { console.error(err.toString()); });
    }
}
