"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_1 = require("botbuilder");
var WebSocket = require('ws');
const Debug = require("debug");
const debug = Debug('botkit:websocket');
const clients = {};
class WebsocketAdapter extends botbuilder_1.BotAdapter {
    constructor(config) {
        super();
        this._config = Object.assign({}, config);
        // Botkit Plugin additions
        this.name = 'Websocket Adapter';
        this.middlewares = {
        // send: [
        //     // make sure the outgoing message has a .ws attached
        //     async(bot, message, next) => {
        //         message.ws = bot.ws;
        //         next();
        //     }
        // ]
        // spawn: [
        //     async (bot, next) => {
        //         // make webex api directly available on a botkit instance.
        //         bot.api = this._api;
        //         next();
        //     }
        // ]
        };
        this.web = [
            {
                method: 'get',
                url: '/admin/web',
                handler: (req, res) => {
                    res.render(this.botkit.plugins.localView(__dirname + '/../public/chat.html'), {});
                }
            }
        ];
        this.menu = [
            {
                title: 'Chat',
                url: '/chat/chat.html',
                icon: '💬'
            }
        ];
    }
    // Botkit init function, called only when used alongside Botkit
    init(botkit) {
        this.botkit = botkit;
        this.botkit.plugins.publicFolder('/chat', __dirname + '/../public');
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
                            // recipient: this.identity.user_id,
                            channelData: message,
                            text: message.text,
                            type: message.type === 'message' ? botbuilder_1.ActivityTypes.Message : message.type,
                        };
                        const context = new botbuilder_1.TurnContext(this, activity);
                        this.runMiddleware(context, (context) => __awaiter(this, void 0, void 0, function* () { return botkit.handleTurn(context); }))
                            .catch((err) => { console.error(err.toString()); });
                    }
                    catch (e) {
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
                ws.on('close', function () {
                    console.log('closing socket for', ws.user);
                    delete (clients[ws.user]);
                    // bot.connected = false;
                });
            });
            setInterval(() => {
                this.wss.clients.forEach(function each(ws) {
                    if (ws.isAlive === false) {
                        return ws.terminate();
                    }
                    //  if (ws.isAlive === false) return ws.terminate()
                    ws.isAlive = false;
                    ws.ping('', false, true);
                });
            }, 30000);
        });
    }
    sendActivities(context, activities) {
        return __awaiter(this, void 0, void 0, function* () {
            const responses = [];
            for (var a = 0; a < activities.length; a++) {
                const activity = activities[a];
                debug('OUTGOING ACTIVITY', activity);
                // const message = {
                //     roomId: activity.conversation ? activity.conversation.id : null,
                //     toPersonId: activity.conversation ? null : activity.recipient.id,
                //     text: activity.text,
                // }
                // responses.push(await this._api.messages.create(message));
                var ws = clients[activity.recipient.id];
                if (ws) {
                    try {
                        ws.send(JSON.stringify(activity));
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
                else {
                    console.error('Could not send message, no websocket found');
                }
            }
            return responses;
        });
    }
    updateActivity(context, activity) {
        return __awaiter(this, void 0, void 0, function* () {
            if (activity.activityId && activity.conversation) {
            }
            else {
                throw new Error('Cannot update activity: activity is missing id');
            }
        });
    }
    deleteActivity(context, reference) {
        return __awaiter(this, void 0, void 0, function* () {
            if (reference.activityId && reference.conversation) {
            }
            else {
                throw new Error('Cannot delete activity: reference is missing activityId');
            }
        });
    }
    continueConversation(reference, logic) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = botbuilder_1.TurnContext.applyConversationReference({ type: 'event', name: 'continueConversation' }, reference, true);
            const context = new botbuilder_1.TurnContext(this, request);
            return this.runMiddleware(context, logic)
                .catch((err) => { console.error(err.toString()); });
        });
    }
    processActivity(req, res, logic) {
        return __awaiter(this, void 0, void 0, function* () {
            res.status(200);
            res.end();
            const activity = req.body;
            // create a conversation reference
            const context = new botbuilder_1.TurnContext(this, activity);
            this.runMiddleware(context, logic)
                .catch((err) => { console.error(err.toString()); });
        });
    }
}
exports.WebsocketAdapter = WebsocketAdapter;
//# sourceMappingURL=websocket_adapter.js.map