var Botkit = require(__dirname + '/CoreBot.js');
var express = require('express');
var bodyParser = require('body-parser');
var querystring = require('querystring');
var request = require('requestretry');
var clone = require('clone');
var async = require('async');
var TeamsAPI = require(__dirname + '/TeamsAPI.js');

function TeamsBot(configuration) {
    var controller = Botkit(configuration || {});

    controller.api = TeamsAPI(configuration || {});

    controller.api.getToken(function(err) {
        if (err) {
            // this is a fatal error - could not create a Teams API client
            throw new Error(err);
        }
    });


    controller.defineBot(function(botkit, config) {
        var bot = {
            type: 'teams',
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances
        };

        bot.startConversation = function(message, cb) {
            botkit.startConversation(this, message, cb);
        };

        bot.createConversation = function(message, cb) {
            botkit.createConversation(this, message, cb);
        };


        bot.channelLink = function(channel_info) {
            return '<a href="https://teams.microsoft.com/l/channel/' + channel_info.id + '/' + channel_info.name + '">' + channel_info.name + '</a>';
        };


        bot.startPrivateConversation = function(message, cb) {

            bot.createPrivateConversation(message, function(err, new_convo) {

                if (err) {
                    cb(err);
                } else {
                    new_convo.activate();
                    cb(null, new_convo);
                }

            });

        };

        bot.createPrivateConversation = function(message, cb) {

            bot.openPrivateConvo(message, function(err, new_convo) {
                if (err) {
                    cb(err);
                } else {
                    message.raw_message.conversation = new_convo;
                    bot.createConversation(message, cb);
                }
            });

        };

        bot.openPrivateConvo = function(src, cb) {

            var data = {
                bot: src.recipient,
                members: [src.raw_message.from],
                channelData: src.channelData,
            };

            bot.api.createConversation(data, cb);

        };

        bot.openConvo = function(src, members, cb) {

            var data = {
                isGroup: true,
                bot: src.recipient,
                members: members,
                channelData: src.channelData,
            };

            bot.api.createConveration(data, cb);
        };


        bot.send = function(message, cb) {
            bot.api.addMessageToConversation(message.conversation.id, message, cb);
        };

        bot.replyWithActivity = function(src, message, cb) {

            var data = {
                type: 'message',
                recipient: src.raw_message.from,
                from: src.raw_message.recipient,
                conversation: src.conversation,
                channelData: {
                    notification: {
                        alert: true
                    }
                },
                text: message.text,
                summary: message.summary,
                attachments: message.attachments || null,
                attachmentLayout: message.attachmentLayout || 'list',
            };

            bot.api.addMessageToConversation(src.conversation.id, data, cb);
        };


        bot.replyToComposeExtension = function(src, attachments, cb) {

            // attachments will be an array of attachments
            // need to wrap it in necessary stuff
            var resp = {
                composeExtension: {
                    type: 'result',
                    attachmentLayout: 'list',
                    attachments: attachments,
                }
            };

            src.http_res.send(resp);
            if (cb) {
                cb();
            }
        };

        bot.replyInThread = function(src, resp, cb) {

            // can't clone theis, not needed for this type of messages.
            delete(src.http_res);
            var copy = clone(src);

            // make sure this does NOT include the activity id
            copy.raw_message.conversation = src.raw_message.channelData.channel;

            bot.reply(copy, resp, cb);

        };

        bot.reply = function(src, resp, cb) {
            if (src.type === 'composeExtension') {
                bot.replyToComposeExtension(src, resp, cb);
            }
            if (typeof resp == 'string') {
                resp = {
                    text: resp
                };
            }

            resp.serviceUrl = src.raw_message.serviceUrl;
            resp.from = src.raw_message.recipient;
            resp.recipient = src.raw_message.from;
            resp.to = src.user;
            resp.channel = src.channel;
            resp.conversation = src.raw_message.conversation;

            bot.say(resp, cb);
        };

        bot.findConversation = function(message, cb) {
            botkit.debug('CUSTOM FIND CONVO', message.user, message.channel);
            for (var t = 0; t < botkit.tasks.length; t++) {
                for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
                    if (
                      botkit.tasks[t].convos[c].isActive() &&
                      botkit.tasks[t].convos[c].source_message.user == message.user
                    ) {
                        botkit.debug('FOUND EXISTING CONVO!');
                        cb(botkit.tasks[t].convos[c]);
                        return;
                    }
                }
            }

            cb();
        };

        // return info about the specific instance of this bot
        // including identity information, and any other info that is relevant
        bot.getInstanceInfo = function(cb) {
            return new Promise(function(resolve, reject) {
                var instance = {
                    identity: {},
                    team: {},
                };

                instance.identity.name = bot.identity.name;
                instance.identity.id = bot.identity.id;
                if (bot.config.team) {
                    instance.team.id = bot.config.team;
                }

                if (cb) cb(null, instance);
                resolve(instance);
            });
        };

        bot.getMessageUser = function(message, cb) {
            return new Promise(function(resolve, reject) {
                bot.api.getUserById(message.channel,  message.user, function(err, identity) {
                    if (err) {
                        if (cb) {
                            cb(err);
                        }
                        return reject(err);
                    }
                    // normalize this into what botkit wants to see
                    var profile = {
                        id: message.user,
                        username: identity.name,
                        first_name: identity.givenName,
                        last_name: identity.surname,
                        full_name: identity.givenName + ' ' + identity.surname,
                        email: identity.email, // may be blank
                        gender: null, // no source for this info
                        timezone: null, //  no source for this info
                        timezone_offset: null, // no source for this info
                    };
                    if (cb) {
                        cb(null, profile);
                    }
                    resolve(profile);
                });
            });

        };

        /* helper functions for creating attachments */
        bot.createAttachment = function(type, title, subtitle, text, images, buttons, tap) {

            var obj = {
                content: (typeof(title) === 'object') ? title : {
                    title: title || null,
                    subtitle: subtitle || null,
                    text: text || null,
                    buttons: buttons || [],
                    images: images || [],
                    tap: tap || null,
                },
                contentType: 'application/vnd.microsoft.card.' + type,
                title: function(v) {
                    this.content.title = v;
                    return this;
                },
                subtitle: function(v) {
                    this.content.subtitle = v;
                    return this;
                },
                text: function(v) {
                    this.content.text = v;
                    return this;
                },
                button: function(type, title, payload) {
                    if (!this.content.buttons) {
                        this.content.buttons = [];
                    }

                    var button_obj = (typeof(type) === 'object') ? type : {
                        type: type,
                        title: title,
                        payload: payload,
                    };

                    this.content.buttons.push(button_obj);
                    return this;
                },
                image: function(url, alt) {
                    if (!this.content.images) {
                        this.content.images = [];
                    }

                    var img_obj = (typeof(url) === 'object') ? type : {
                        url: url,
                        alt: alt || null
                    };

                    this.content.images.push(img_obj);
                    return this;
                },
                tap: function(type, title, payload) {
                    var tap_action = (typeof(type) === 'object') ? type : {
                        type: type,
                        title: title,
                        payload: payload,
                    };

                    this.content.tap = tap_action;

                    return this;
                },
                asString: function() {
                    return JSON.stringify(this, null, 2);
                }
            };

            return obj;

        };

        bot.createHero = function(title, subtitle, text, buttons, images, tap) {
            return bot.createAttachment('hero', title, subtitle, text, buttons, images, tap);
        };

        bot.createThumbnail = function(title, subtitle, text, buttons, images, tap) {
            return bot.createAttachment('thumbnail', title, subtitle, text, buttons, images, tap);
        };

        return bot;
    });


    controller.createWebhookEndpoints = function() {
        controller.webserver.post('/teams/receive', function(req, res) {

            var message = req.body;

            var options = {
                serviceUrl: message.serviceUrl,
            };

            if (message.channelData && message.channelData.team && message.channelData.team.id) {
                options.team = message.channelData.team.id;
            }

            var bot = controller.spawn(options);

            if (message.recipient) {
                bot.identity = message.recipient;
            }

            controller.ingest(bot, message, res);

        });
    };

    controller.middleware.spawn.use(function(bot, next) {

        if (!bot.config.serviceUrl) {
            throw new Error('Cannot spawn a bot without a serviceUrl in the configuration');
        }

        // set up the teams api client
        bot.api = TeamsAPI({
            clientId: controller.config.clientId,
            clientSecret: controller.config.clientSecret,
            token: controller.config.token,
            serviceUrl: bot.config.serviceUrl,
            team: bot.config.team,
        });

        next();

    });

    controller.middleware.ingest.use(function(bot, message, res, next) {

        res.status(200);
        if (message.name != 'composeExtension/query') {
            // send a result back immediately
            res.send('');
        }

        message.http_res = res;
        next();

    });

    controller.middleware.normalize.use(function(bot, message, next) {

        message.user = message.raw_message.from.id;
        message.channel = message.raw_message.conversation.id;

        next();

    });


    controller.middleware.categorize.use(function(bot, message, next) {

        if (message.type === 'invoke' && message.name === 'composeExtension/query') {
            message.type = 'composeExtension';

            // teams only supports a single parameter, it either exists or doesn't!
            message.text = message.value.parameters[0].value;

        }

        next();

    });


    controller.middleware.categorize.use(function(bot, message, next) {

        if (message.type == 'conversationUpdate') {

            if (message.raw_message.membersAdded) {
                // replies to these end up in the right place
                for (var m = 0; m < message.raw_message.membersAdded.length; m++) {

                    // clone the message
                    // and copy this member into the from list
                    delete(message.http_res); // <-- that can't be cloned safely
                    var copy = clone(message);
                    copy.from = message.raw_message.membersAdded[m];
                    copy.user = copy.from.id;

                    if (copy.user == message.raw_message.recipient.id) {
                        copy.type = 'bot_channel_join';
                    } else {
                        copy.type = 'user_channel_join';
                    }

                    // restart the categorize process for the newly cloned messages
                    controller.categorize(bot, copy);

                }

            } else if (message.raw_message.membersRemoved) {

                // replies to these end up in the right place
                for (var m = 0; m < message.raw_message.membersRemoved.length; m++) {

                    // clone the message
                    // and copy this member into the from list
                    delete(message.http_res); // <-- that can't be cloned safely
                    var copy = clone(message);
                    copy.from = message.raw_message.membersRemoved[m];
                    copy.user = copy.from.id;

                    if (copy.user == message.raw_message.recipient.id) {
                        copy.type = 'bot_channel_leave';
                    } else {
                        copy.type = 'user_channel_leave';
                    }

                    // restart the categorize process for the newly cloned messages
                    controller.categorize(bot, copy);
                }

                next();
            } else if (message.raw_message.channelData && message.raw_message.channelData.eventType) {
                // channelCreated
                // channelDeleted
                // channelRenamed
                // teamRenamed
                message.type = message.raw_message.channelData.eventType;

                // replies to these end up in general
                next();
            }

        } else {
            next();
        }
    });


    controller.middleware.categorize.use(function(bot, message, next) {

        if (message.type == 'message') message.type = 'message_received';

        if (!message.conversation.isGroup && message.type == 'message_received') {
            message.type = 'direct_message';
        } else if (message.conversation.isGroup && message.type == 'message_received') {

            // start by setting this to a mention, meaning that the bot's name was _somewhere_ in the string
            message.type = 'mention';

            // check to see if this is a direct mention ,meaning bot was mentioned at start of string
            for (var e = 0; e < message.entities.length; e++) {
                var entity = message.entities[0];
                if (entity.type == 'mention' && message.text) {
                    var pattern = new RegExp(message.recipient.id);
                    if (entity.mentioned.id.match(pattern)) {
                        var clean = new RegExp('^' + entity.text + '\\s+');

                        if (message.text.match(clean)) {

                            message.text = message.text.replace(clean, '');
                            message.type = 'direct_mention';
                        }
                    }
                }
            }
        }

        next();
    });


    // This middleware looks for Slack-style user mentions in a message
    // <@USERID> and translates them into Microsoft Teams style mentions
    // which look like <at>@User Name</at> and have a matching row in the
    // message.entities field.
    controller.middleware.send.use(function(bot, message, next) {

        var matches;
        var uniques = [];

        // extract all the <@USERID> patterns
        if (matches = message.text.match(/\<\@(.*?)\>/igm)) {

            // get a set of UNIQUE mentions - since the lookup of profile data is expensive
            for (var m = 0; m < matches.length; m++) {
                if (uniques.indexOf(matches[m]) == -1) {
                    uniques.push(matches[m]);
                }
            }

            // loop over each mention
            async.each(uniques, function(match, next_match) {

                var uid = match.replace(/^\<\@/, '').replace(/\>$/, '');

                // use the teams API to load the latest profile information for the user
                bot.api.getUserById(message.channel,  uid, function(err, user_profile) {

                    // if user is valid, replace the Slack-style mention and append to entities list
                    if (user_profile) {
                        var pattern = new RegExp('<@' + uid + '>', 'g');
                        message.text = message.text.replace(pattern, '<at>@' + user_profile.name + '</at>');

                        if (!message.entities) {
                            message.entities = [];
                        }

                        message.entities.push({
                            type: 'mention',
                            mentioned: {
                                id: uid,
                                name: user_profile.name,
                            },
                            text: '<at>@' + user_profile.name + '</at>',
                        });
                    }

                    next_match();

                });

            }, function() {

                // we've processed all the matches, continue
                next();

            });

        } else {

            // if there were no matches, continue
            next();

        }

    });

    controller.middleware.format.use(function(bot, message, platform_message, next) {

        platform_message.type = 'message';
        platform_message.recipient =  message.recipient;
        platform_message.from =  message.from;
        platform_message.text =  message.text;
        platform_message.textFormat =  'markdown';
        platform_message.entities =  message.entities;
        platform_message.attachments =  message.attachments || null;
        platform_message.attachmentLayout =  message.attachmentLayout || 'list';
        platform_message.conversation =  message.conversation;

        next();
    });

    controller.startTicking();
    return controller;
}

module.exports = TeamsBot;
