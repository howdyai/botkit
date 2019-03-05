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
const client_1 = require("@slack/client");
const Debug = require("debug");
const request = require("request");
const debug = Debug('botkit:slack');
;
const userIdByBotId = {};
const userIdByTeamId = {};
class SlackAdapter extends botbuilder_1.BotAdapter {
    // TODO: Define options
    constructor(options) {
        super();
        this.options = options;
        if (!this.options.verificationToken) {
            throw new Error('Required: include a verificationToken to verify incoming Events API webhooks');
        }
        if (this.options.botToken) {
            this.slack = new client_1.WebClient(this.options.botToken);
            this.slack.auth.test().then((raw_identity) => {
                const identity = raw_identity;
                debug('** Slack adapter running in single team mode.');
                debug('** My Slack identity: ', identity.user, 'on team', identity.team);
                this.identity = { user_id: identity.user_id };
            }).catch((err) => {
                // This is a fatal error! Invalid credentials have been provided and the bot can't start.
                console.error(err);
                process.exit(1);
            });
        }
        else if (!this.options.getTokenForTeam || !this.options.getBotUserByTeam) {
            // This is a fatal error. No way to get a token to interact with the Slack API.
            console.error('Missing Slack API credentials! Provide either a botToken or a getTokenForTeam() and getBotUserByTeam function as part of the SlackAdapter options.');
            process.exit(1);
        }
        else if (!this.options.clientId || !this.options.clientSecret || !this.options.scopes || !this.options.redirectUri) {
            // This is a fatal error. Need info to connet to Slack via oauth
            console.error('Missing Slack API credentials! Provide clientId, clientSecret, scopes and redirectUri as part of the SlackAdapter options.');
            process.exit(1);
        }
        else {
            debug('** Slack adapter running in multi-team mode.');
        }
        this.name = 'Slack Adapter';
        this.middlewares = {
            spawn: [
                (bot, next) => __awaiter(this, void 0, void 0, function* () {
                    console.log('inside spawn');
                    // make the Slack API available to all bot instances.
                    bot.api = yield this.getAPI(bot.getConfig('activity')).catch((err) => {
                        return next(new Error('Could not spawn a Slack API instance'));
                    });
                    bot.startPrivateConversation = function (userId) {
                        return __awaiter(this, void 0, void 0, function* () {
                            // create the new IM channel
                            const channel = yield bot.api.im.open({ user: userId });
                            if (channel.ok === true) {
                                // now, switch contexts
                                return this.changeContext({
                                    conversation: {
                                        id: channel.channel.id,
                                        team: this.getConfig('activity').conversation.team,
                                    },
                                    user: { id: userId },
                                    channelId: 'slack',
                                });
                            }
                            else {
                                console.error(channel);
                                throw new Error('Error creating IM channel');
                            }
                        });
                    };
                    bot.startConversationInChannel = function (channelId, userId) {
                        return __awaiter(this, void 0, void 0, function* () {
                            return this.changeContext({
                                conversation: {
                                    id: channelId,
                                    team: this.getConfig('activity').conversation.team,
                                },
                                user: { id: userId },
                                channelId: 'slack',
                            });
                        });
                    };
                    bot.startConversationInThread = function (channelId, userId, thread_ts) {
                        return __awaiter(this, void 0, void 0, function* () {
                            return this.changeContext({
                                conversation: {
                                    id: channelId,
                                    thread_ts: thread_ts,
                                    team: this.getConfig('activity').conversation.team,
                                },
                                user: { id: userId },
                                channelId: 'slack',
                            });
                        });
                    };
                    /* Send a reply to an inbound message, using information collected from that inbound message */
                    bot.replyInThread = function (src, resp) {
                        return __awaiter(this, void 0, void 0, function* () {
                            // make sure the  thread_ts setting is set
                            // this will be included in the conversation reference
                            // src.incoming_message.conversation.id = src.incoming_message.conversation.id + '-' + (src.incoming_message.channelData.thread_ts ? src.incoming_message.channelData.thread_ts : src.incoming_message.channelData.ts);
                            src.incoming_message.conversation.thread_ts = src.incoming_message.channelData.thread_ts ? src.incoming_message.channelData.thread_ts : src.incoming_message.channelData.ts;
                            return bot.reply(src, resp);
                        });
                    };
                    /* Send a reply to an inbound message, using information collected from that inbound message */
                    bot.replyEphemeral = function (src, resp) {
                        return __awaiter(this, void 0, void 0, function* () {
                            // make rure resp is in an object format.
                            resp = bot.ensureMessageFormat(resp);
                            // make sure ephemeral is set
                            // fields set in channelData will end up in the final message to slack
                            resp.channelData = Object.assign({}, resp.channelData, { ephemeral: true });
                            return bot.reply(src, resp);
                        });
                    };
                    /* send a public response to a slash command */
                    bot.replyPublic = function (src, resp) {
                        return __awaiter(this, void 0, void 0, function* () {
                            const msg = bot.ensureMessageFormat(resp);
                            msg.response_type = 'in_channel';
                            return bot.replyInteractive(src, msg);
                        });
                    };
                    /* send a private response to a slash command */
                    bot.replyPrivate = function (src, resp) {
                        return __awaiter(this, void 0, void 0, function* () {
                            const msg = bot.ensureMessageFormat(resp);
                            msg.response_type = 'ephemeral';
                            msg.to = src.user;
                            return bot.replyInteractive(src, msg);
                        });
                    };
                    bot.replyInteractive = function (src, resp) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (!src.incoming_message.channelData.response_url) {
                                throw Error('No response_url found in incoming message');
                            }
                            else {
                                let msg = bot.ensureMessageFormat(resp);
                                msg.channel = src.channel;
                                msg.to = src.user;
                                // if source message is in a thread, reply should also be in the thread
                                if (src.incoming_message.channelData.thread_ts) {
                                    msg.thread_ts = src.incoming_message.channelData.thread_ts;
                                }
                                var requestOptions = {
                                    uri: src.incoming_message.channelData.response_url,
                                    method: 'POST',
                                    json: msg
                                };
                                return new Promise(function (resolve, reject) {
                                    request(requestOptions, function (err, res, body) {
                                        if (err) {
                                            reject(err);
                                        }
                                        else {
                                            resolve(body);
                                        }
                                    });
                                });
                            }
                        });
                    };
                    next();
                })
            ]
        };
        this.web = [
            {
                method: 'get',
                url: '/admin/slack',
                handler: (req, res) => {
                    res.render(this.botkit.plugins.localView(__dirname + '/../views/slack.hbs'), {
                        slack_config: this.options,
                        botkit_config: this.botkit.getConfig(),
                        host: req.get('host'),
                        protocol: req.protocol,
                        install_link: this.getInstallLink(),
                    });
                }
            }
        ];
        this.menu = [
            {
                title: 'Slack',
                url: '/admin/slack',
                icon: '#'
            }
        ];
    }
    init(botkit) {
        // capture Botkit controller for use in web endpoints
        this.botkit = botkit;
    }
    getAPI(activity) {
        return __awaiter(this, void 0, void 0, function* () {
            // use activity.channelData.team.id (the slack team id) and get the appropriate token using getTokenForTeam
            if (this.slack) {
                return this.slack;
            }
            else {
                // @ts-ignore 
                if (activity.conversation.team) {
                    // @ts-ignore 
                    const token = yield this.options.getTokenForTeam(activity.conversation.team);
                    if (!token) {
                        throw new Error('Missing credentials for team.');
                    }
                    return new client_1.WebClient(token);
                }
                else {
                    // No API can be created, this is 
                    debug('Unable to create API based on activity: ', activity);
                }
            }
        });
    }
    getBotUserByTeam(activity) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.identity) {
                return this.identity.user_id;
            }
            else {
                // @ts-ignore
                if (activity.conversation.team) {
                    // @ts-ignore 
                    const user_id = yield this.options.getBotUserByTeam(activity.conversation.team);
                    if (!user_id) {
                        throw new Error('Missing credentials for team.');
                    }
                    return user_id;
                }
                else {
                    debug('Could not find bot user id based on activity: ', activity);
                }
            }
        });
    }
    getInstallLink() {
        if (this.options.clientId && this.options.scopes) {
            const redirect = 'https://slack.com/oauth/authorize?client_id=' + this.options.clientId + '&scope=' + this.options.scopes.join(',');
            return redirect;
        }
        else {
            console.warn('getInstallLink() cannot be called without clientId and scopes in adapter options');
            return '';
        }
    }
    validateOauthCode(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const slack = new client_1.WebClient();
            const results = yield slack.oauth.access({
                code: code,
                client_id: this.options.clientId,
                client_secret: this.options.clientSecret,
                redirect_uri: this.options.redirectUri
            });
            if (results.ok) {
                return results;
            }
            else {
                // TODO: What should we return here?
                throw new Error(results.error);
            }
        });
    }
    activityToSlack(activity) {
        //        let [ channelId, thread_ts ] = activity.conversation.id.split('-');
        let channelId = activity.conversation.id;
        let thread_ts = activity.conversation.thread_ts;
        const message = {
            channel: channelId,
            text: activity.text,
            thread_ts: activity.thread_ts ? activity.thread_ts : thread_ts,
            username: activity.username || null,
            reply_broadcast: activity.reply_broadcast || null,
            parse: activity.parse || null,
            link_names: activity.link_names || null,
            attachments: activity.attachments ? JSON.stringify(activity.attachments) : null,
            blocks: activity.blocks ? JSON.stringify(activity.blocks) : null,
            unfurl_links: typeof activity.unfurl_links !== 'undefined' ? activity.unfurl_links : null,
            unfurl_media: typeof activity.unfurl_media !== 'undefined' ? activity.unfurl_media : null,
            icon_url: activity.icon_url || null,
            icon_emoji: activity.icon_emoji || null,
            as_user: activity.as_user || true,
            ephemeral: activity.ephemeral || false,
            user: null,
        };
        // if channelData is specified, overwrite any fields in message object
        if (activity.channelData) {
            Object.keys(activity.channelData).forEach(function (key) {
                message[key] = activity.channelData[key];
            });
        }
        // should this message be sent as an ephemeral message
        if (message.ephemeral) {
            message.user = activity.recipient.id;
        }
        if (message.icon_url || message.icon_emoji || message.username) {
            message.as_user = false;
        }
        return message;
    }
    sendActivities(context, activities) {
        return __awaiter(this, void 0, void 0, function* () {
            const responses = [];
            for (var a = 0; a < activities.length; a++) {
                const activity = activities[a];
                if (activity.type === botbuilder_1.ActivityTypes.Message) {
                    const message = this.activityToSlack(activity);
                    try {
                        const slack = yield this.getAPI(context.activity);
                        let result = null;
                        if (message.ephemeral) {
                            debug('chat.postEphemeral:', message);
                            result = (yield slack.chat.postEphemeral(message));
                        }
                        else {
                            debug('chat.postMessage:', message);
                            result = (yield slack.chat.postMessage(message));
                        }
                        if (result.ok === true) {
                            responses.push({
                                id: result.ts,
                                activityId: result.ts,
                                conversation: result.channel,
                            });
                        }
                        else {
                            console.error('Error sending activity to Slack:', result);
                        }
                    }
                    catch (err) {
                        console.error('Error sending activity to Slack:', err);
                    }
                }
                else {
                    // TODO: Handle sending of other types of message?
                }
            }
            return responses;
        });
    }
    updateActivity(context, activity) {
        return __awaiter(this, void 0, void 0, function* () {
            if (activity.id && activity.conversation) {
                try {
                    const message = this.activityToSlack(activity);
                    // set the id of the message to be updated
                    message.ts = activity.id;
                    const slack = yield this.getAPI(activity);
                    const results = yield slack.chat.update(message);
                    if (!results.ok) {
                        console.error('Error updating activity on Slack:', results);
                    }
                }
                catch (err) {
                    console.error('Error updating activity on Slack:', err);
                }
            }
            else {
                throw new Error('Cannot update activity: activity is missing id');
            }
        });
    }
    deleteActivity(context, reference) {
        return __awaiter(this, void 0, void 0, function* () {
            if (reference.activityId && reference.conversation) {
                try {
                    const slack = yield this.getAPI(context.activity);
                    const results = yield slack.chat.delete({ ts: reference.activityId, channel: reference.conversation.id });
                    if (!results.ok) {
                        console.error('Error deleting activity:', results);
                    }
                }
                catch (err) {
                    console.error('Error deleting activity', err);
                    throw err;
                }
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
            // Create an Activity based on the incoming message from Slack.
            // There are a few different types of event that Slack might send.
            let event = req.body;
            if (event.type === 'url_verification') {
                res.status(200);
                res.send(event.challenge);
            }
            else if (event.payload) {
                // TODO: 
                // What type of event is this? interactive callback?
                event = JSON.parse(event.payload);
                if (event.token !== this.options.verificationToken) {
                    console.error('Rejected due to mismatched verificationToken:', event);
                    res.status(403);
                    res.end();
                }
                else {
                    const activity = {
                        timestamp: new Date(),
                        channelId: 'slack',
                        conversation: {
                            // TODO: conversation address probably needs to include team and user as well
                            // (otherwise other users in same channel can interfere)
                            // but this comprimises what we do in the reverse inside botkit
                            // to get a channel id back out...
                            id: event.channel.id,
                            thread_ts: event.thread_ts,
                            team: event.team.id,
                        },
                        from: { id: event.bot_id ? event.bot_id : event.user.id },
                        // recipient: this.identity.user_id,
                        channelData: event,
                        type: botbuilder_1.ActivityTypes.Event
                    };
                    // create a conversation reference
                    // @ts-ignore
                    const context = new botbuilder_1.TurnContext(this, activity);
                    // send http response back
                    // TODO: Dialog submissions have other options including HTTP response codes
                    res.status(200);
                    res.end();
                    yield this.runMiddleware(context, logic)
                        .catch((err) => { throw err; });
                }
            }
            else if (event.type === 'event_callback') {
                console.log('EVENT', event);
                // this is an event api post
                if (event.token !== this.options.verificationToken) {
                    console.error('Rejected due to mismatched verificationToken:', event);
                    res.status(403);
                    res.end();
                }
                else {
                    const activity = {
                        id: event.event.ts,
                        timestamp: new Date(),
                        channelId: 'slack',
                        conversation: {
                            id: event.event.channel,
                            thread_ts: event.event.thread_ts,
                        },
                        from: { id: event.event.bot_id ? event.event.bot_id : event.event.user },
                        // recipient: event.api_app_id, // TODO: what should this actually be? hard to make it consistent.
                        channelData: event.event,
                        text: null,
                        type: botbuilder_1.ActivityTypes.Event
                    };
                    // Normalize the location of the team id
                    activity.channelData.team = event.team_id;
                    // add the team id to the conversation record
                    // @ts-ignore -- Tell Typescript to ignore this overload
                    activity.conversation.team = activity.channelData.team;
                    // If this is conclusively a message originating from a user, we'll mark it as such
                    if (event.event.type === 'message' && !event.event.subtype) {
                        activity.type = botbuilder_1.ActivityTypes.Message;
                        activity.text = event.event.text;
                    }
                    // create a conversation reference
                    // @ts-ignore
                    const context = new botbuilder_1.TurnContext(this, activity);
                    // send http response back
                    res.status(200);
                    res.end();
                    yield this.runMiddleware(context, logic)
                        .catch((err) => { throw err; });
                }
            }
            else if (event.command) {
                if (event.token !== this.options.verificationToken) {
                    console.error('Rejected due to mismatched verificationToken:', event);
                    res.status(403);
                    res.end();
                }
                else {
                    // this is a slash command
                    const activity = {
                        id: event.trigger_id,
                        timestamp: new Date(),
                        channelId: 'slack',
                        conversation: {
                            id: event.channel_id,
                        },
                        from: { id: event.user_id },
                        channelData: event,
                        text: event.text,
                        type: botbuilder_1.ActivityTypes.Event
                    };
                    // Normalize the location of the team id
                    activity.channelData.team = event.team_id;
                    // add the team id to the conversation record
                    // @ts-ignore -- Tell Typescript to ignore this overload
                    activity.conversation.team = activity.channelData.team;
                    activity.channelData.botkitEventType = 'slash_command';
                    // create a conversation reference
                    // @ts-ignore
                    const context = new botbuilder_1.TurnContext(this, activity);
                    // send http response back
                    res.status(200);
                    res.end();
                    yield this.runMiddleware(context, logic)
                        .catch((err) => { throw err; });
                }
            }
            else {
                console.error('Unknown Slack event type: ', event);
            }
        });
    }
}
exports.SlackAdapter = SlackAdapter;
class SlackEventMiddleware extends botbuilder_1.MiddlewareSet {
    onTurn(context, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (context.activity.type === botbuilder_1.ActivityTypes.Event && context.activity.channelData) {
                // Handle message sub-types
                if (context.activity.channelData.subtype) {
                    context.activity.channelData.botkitEventType = context.activity.channelData.subtype;
                }
                else if (context.activity.channelData.type) {
                    context.activity.channelData.botkitEventType = context.activity.channelData.type;
                }
            }
            yield next();
        });
    }
}
exports.SlackEventMiddleware = SlackEventMiddleware;
class SlackMessageTypeMiddleware extends botbuilder_1.MiddlewareSet {
    onTurn(context, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (context.activity.type === 'message' && context.activity.channelData) {
                // TODO: how will this work in multi-team scenarios?
                const bot_user_id = yield context.adapter.getBotUserByTeam(context.activity);
                var mentionSyntax = '<@' + bot_user_id + '(\\|.*?)?>';
                var mention = new RegExp(mentionSyntax, 'i');
                var direct_mention = new RegExp('^' + mentionSyntax, 'i');
                // is this a DM, a mention, or just ambient messages passing through?
                if (context.activity.channelData.channel_type && context.activity.channelData.channel_type === 'im') {
                    context.activity.channelData.botkitEventType = 'direct_message';
                    // strip any potential leading @mention
                    context.activity.text = context.activity.text.replace(direct_mention, '')
                        .replace(/^\s+/, '').replace(/^\:\s+/, '').replace(/^\s+/, '');
                }
                else if (bot_user_id && context.activity.text && context.activity.text.match(direct_mention)) {
                    context.activity.channelData.botkitEventType = 'direct_mention';
                    // strip the @mention
                    context.activity.text = context.activity.text.replace(direct_mention, '')
                        .replace(/^\s+/, '').replace(/^\:\s+/, '').replace(/^\s+/, '');
                }
                else if (bot_user_id && context.activity.text && context.activity.text.match(mention)) {
                    context.activity.channelData.botkitEventType = 'mention';
                }
                else {
                    // this is an "ambient" message
                }
                // if this is a message from a bot, we probably want to ignore it.
                // switch the botkit event type to bot_message
                // and the activity type to Event <-- will stop it from being included in dialogs
                // NOTE: This catches any message from any bot, including this bot.
                if (context.activity.channelData && context.activity.channelData.bot_id) {
                    context.activity.channelData.botkitEventType = 'bot_message';
                    context.activity.type = botbuilder_1.ActivityTypes.Event;
                }
            }
            yield next();
        });
    }
}
exports.SlackMessageTypeMiddleware = SlackMessageTypeMiddleware;
class SlackIdentifyBotsMiddleware extends botbuilder_1.MiddlewareSet {
    onTurn(context, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // prevent bots from being confused by self-messages.
            // PROBLEM: we don't have our own bot_id!
            // SOLUTION: load it up and compare!
            // TODO: perhaps this should be cached somehow?
            // TODO: error checking on this API call!
            if (context.activity.channelData && context.activity.channelData.bot_id) {
                let botUserId = null;
                if (this.botIds[context.activity.channelData.bot_id]) {
                    console.log('GOT CACHED BOT ID');
                    botUserId = this.botIds[context.activity.channelData.bot_id];
                }
                else {
                    console.log('LOAD BOT ID');
                    const slack = yield context.adapter.getAPI(context.activity);
                    const bot_info = yield slack.bots.info({ bot: context.activity.channelData.bot_id });
                    if (bot_info.ok) {
                        this.botIds[context.activity.channelData.bot_id] = bot_info.bot.user_id;
                        botUserId = this.botIds[context.activity.channelData.bot_id];
                    }
                }
                // if we successfully loaded the bot's identity...
                if (botUserId) {
                    console.log('GOT A BOT USER MESSAGE HERE', context.activity);
                    console.log('USER ID: ', botUserId);
                }
            }
            // // TODO: getting identity out of adapter is brittle!
            // if (context.activity.from === context.adapter.identity.user_id) {
            //     context.activity.type = 'self_' + context.activity.type;
            // }
            yield next();
        });
    }
}
exports.SlackIdentifyBotsMiddleware = SlackIdentifyBotsMiddleware;
//# sourceMappingURL=slack_adapter.js.map