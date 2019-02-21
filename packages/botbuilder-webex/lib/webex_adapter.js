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
const ciscospark = require("ciscospark");
const url = require("url");
const crypto = require("crypto");
const Debug = require("debug");
const debug = Debug('botkit:webex');
class WebexAdapter extends botbuilder_1.BotAdapter {
    constructor(config) {
        super();
        this._config = Object.assign({}, config);
        if (!this._config.access_token) {
            throw new Error('access_token required to create controller');
        }
        else {
            this._api = ciscospark.init({
                credentials: {
                    authorization: {
                        access_token: this._config.access_token
                    }
                }
            });
            if (!this._api) {
                throw new Error('Could not create the Webex Teams API client');
            }
            this._api.people.get('me').then((identity) => {
                debug('Webex: My identity is', identity);
                this._identity = identity;
            }).catch(function (err) {
                throw new Error(err);
            });
        }
        if (!this._config.public_address) {
            throw new Error('public_address parameter required to receive webhooks');
        }
        else {
            var endpoint = url.parse(this._config.public_address);
            if (!endpoint.hostname) {
                throw new Error('Could not determine hostname of public address: ' + this._config.public_address);
            }
            else {
                this._config.public_address = endpoint.hostname + (endpoint.port ? ':' + endpoint.port : '');
            }
        }
        if (!this._config.secret) {
            console.warn('WARNING: No secret specified. Source of incoming webhooks will not be validated. https://developer.webex.com/webhooks-explained.html#auth');
            // throw new Error('secret parameter required to secure webhooks');
        }
        // Botkit Plugin additions
        this.name = 'Webex Adapter';
        this.middlewares = {
            spawn: [
                (bot, next) => __awaiter(this, void 0, void 0, function* () {
                    // make webex api directly available on a botkit instance.
                    bot.api = this._api;
                    bot.startPrivateConversation = function (userId) {
                        return __awaiter(this, void 0, void 0, function* () {
                            // send a message with the toPersonId or toPersonEmail set
                            // response will have the roomID
                            return this.changeContext({
                                from: { id: userId },
                                conversation: { id: 'temp' },
                                channelId: 'webex'
                            });
                        });
                    };
                    next();
                })
            ]
        };
    }
    // Botkit init function, called only when used alongside Botkit
    init(botkit) {
        // when the bot is ready, register the webhook subscription with the Webex API
        botkit.ready(() => {
            console.log('Registering webhook subscription!');
            botkit.adapter.registerWebhookSubscription(botkit.getConfig('webhook_uri'));
        });
    }
    // TODO: make async
    resetWebhookSubscriptions() {
        this._api.webhooks.list().then((list) => {
            for (var i = 0; i < list.items.length; i++) {
                this._api.webhooks.remove(list.items[i]).then(function () {
                    // console.log('Removed subscription: ' + list.items[i].name);
                }).catch(function (err) {
                    console.error('Error removing subscription:', err);
                });
            }
        });
    }
    ;
    registerWebhookSubscription(webhook_path) {
        var webhook_name = this._config.webhook_name || 'Botkit Firehose';
        this._api.webhooks.list().then((list) => {
            var hook_id = null;
            for (var i = 0; i < list.items.length; i++) {
                if (list.items[i].name == webhook_name) {
                    hook_id = list.items[i].id;
                }
            }
            var hook_url = 'https://' + this._config.public_address + webhook_path;
            debug('Webex: incoming webhook url is ', hook_url);
            if (hook_id) {
                this._api.webhooks.update({
                    id: hook_id,
                    resource: 'all',
                    targetUrl: hook_url,
                    event: 'all',
                    secret: this._config.secret,
                    name: webhook_name,
                }).then(function () {
                    debug('Webex: SUCCESSFULLY UPDATED WEBEX WEBHOOKS');
                }).catch(function (err) {
                    console.error('FAILED TO REGISTER WEBHOOK', err);
                    throw new Error(err);
                });
            }
            else {
                this._api.webhooks.create({
                    resource: 'all',
                    targetUrl: hook_url,
                    event: 'all',
                    secret: this._config.secret,
                    name: webhook_name,
                }).then(function () {
                    debug('Webex: SUCCESSFULLY REGISTERED WEBEX WEBHOOKS');
                }).catch(function (err) {
                    console.error('FAILED TO REGISTER WEBHOOK', err);
                    throw new Error(err);
                });
            }
        }).catch(function (err) {
            throw new Error(err);
        });
    }
    sendActivities(context, activities) {
        return __awaiter(this, void 0, void 0, function* () {
            const responses = [];
            for (var a = 0; a < activities.length; a++) {
                const activity = activities[a];
                debug('OUTGOING ACTIVITY', activity);
                const message = {
                    roomId: activity.conversation ? activity.conversation.id : null,
                    toPersonId: activity.conversation ? null : activity.recipient.id,
                    text: activity.text,
                };
                let response = yield this._api.messages.create(message).catch((err) => {
                    throw new Error(err);
                });
                responses.push(response);
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
            return this.runMiddleware(context, logic);
        });
    }
    processActivity(req, res, logic) {
        return __awaiter(this, void 0, void 0, function* () {
            res.status(200);
            res.end();
            var payload = req.body;
            let activity;
            if (this._config.secret) {
                var signature = req.headers['x-spark-signature'];
                var hash = crypto.createHmac('sha1', this._config.secret).update(JSON.stringify(payload)).digest('hex');
                if (signature != hash) {
                    console.warn('WARNING: Webhook received message with invalid signature. Potential malicious behavior!');
                    return false;
                }
            }
            if (payload.resource === 'messages' && payload.event === 'created') {
                const decrypted_message = yield this._api.messages.get(payload.data);
                activity = {
                    id: decrypted_message.id,
                    timestamp: new Date(),
                    channelId: 'webex',
                    conversation: { id: decrypted_message.roomId },
                    from: { id: decrypted_message.personId, name: decrypted_message.personEmail },
                    text: decrypted_message.text,
                    channelData: decrypted_message,
                    type: botbuilder_1.ActivityTypes.Message
                };
                // this is the bot speaking
                if (activity.from.id === this._identity.id) {
                    activity.type = 'self_message';
                }
                if (decrypted_message.html) {
                    // strip the mention & HTML from the message
                    var pattern = new RegExp('^(\<p\>)?\<spark\-mention .*?data\-object\-id\=\"' + this._identity.id + '\".*?\>.*?\<\/spark\-mention\>', 'im');
                    if (!decrypted_message.html.match(pattern)) {
                        var encoded_id = this._identity.id;
                        var decoded = new Buffer(encoded_id, 'base64').toString('ascii');
                        // this should look like ciscospark://us/PEOPLE/<id string>
                        var matches;
                        if (matches = decoded.match(/ciscospark\:\/\/.*\/(.*)/im)) {
                            pattern = new RegExp('^(\<p\>)?\<spark\-mention .*?data\-object\-id\=\"' + matches[1] + '\".*?\>.*?\<\/spark\-mention\>', 'im');
                        }
                    }
                    var action = decrypted_message.html.replace(pattern, '');
                    // strip the remaining HTML tags
                    action = action.replace(/\<.*?\>/img, '');
                    // strip remaining whitespace
                    action = action.trim();
                    // replace the message text with the the HTML version
                    activity.text = action;
                }
                else {
                    var pattern = new RegExp('^' + this._identity.displayName + '\\s+', 'i');
                    if (activity.text) {
                        activity.text = activity.text.replace(pattern, '');
                    }
                }
                // create a conversation reference
                const context = new botbuilder_1.TurnContext(this, activity);
                this.runMiddleware(context, logic)
                    .catch((err) => { console.error(err.toString()); });
            }
            else {
                // type == payload.resource + '.' + payload.event 
                // memberships.deleted for example
                // payload.data contains stuff
                activity = {
                    id: payload.id,
                    timestamp: new Date(),
                    channelId: 'webex',
                    conversation: { id: payload.data.roomId },
                    from: { id: payload.actorId },
                    channelData: payload,
                    type: botbuilder_1.ActivityTypes.Event
                };
                const context = new botbuilder_1.TurnContext(this, activity);
                this.runMiddleware(context, logic)
                    .catch((err) => { console.error(err.toString()); });
            }
        });
    }
}
exports.WebexAdapter = WebexAdapter;
//# sourceMappingURL=webex_adapter.js.map