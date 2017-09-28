var request = require('request');
var Promise = require('promise');
var md5 = require('md5');
var SDK = require('botkit-studio-sdk');

module.exports = function(controller) {
    var before_hooks = {};
    var after_hooks = {};
    var answer_hooks = {};
    var thread_hooks = {};

    // define a place for the studio specific features to live.
    controller.studio = {};

    /* ----------------------------------------------------------------
     * Botkit Studio Script Services
     * The features in this section grant access to Botkit Studio's
     * script and trigger services
     * ---------------------------------------------------------------- */

    function genConfig(bot) {
        var config = {};

        if (bot.config && bot.config.studio_token) {
            config.studio_token = bot.config.studio_token;
        }

        if (bot.config && bot.config.studio_command_uri) {
            config.studio_command_uri = bot.config.studio_command_uri;
        }

        if (controller.config && controller.config.studio_token) {
            config.studio_token = controller.config.studio_token;
        }

        if (controller.config && controller.config.studio_command_uri) {
            config.studio_command_uri = controller.config.studio_command_uri;
        }

        return config;
    }

    controller.studio.evaluateTrigger = function(bot, text, user) {

        var userHash = md5(user);
        var sdk = new SDK(genConfig(bot));
        return sdk.evaluateTrigger(text, userHash);

    };




    // load a script from the pro service
    controller.studio.getScript = function(bot, text, user) {

        var userHash = md5(user);
        var sdk = new SDK(genConfig(bot));
        return sdk.getScript(text, user);
    };


    // these are middleware functions
    controller.studio.validate = function(command_name, key, func) {

        if (!answer_hooks[command_name]) {
            answer_hooks[command_name] = [];

        }
        if (key && !answer_hooks[command_name][key]) {
            answer_hooks[command_name][key] = [];
        }

        answer_hooks[command_name][key].push(func);

        return controller.studio;
    };


    controller.studio.beforeThread = function(command_name, thread_name, func) {

        if (!thread_hooks[command_name]) {
            thread_hooks[command_name] = [];

        }
        if (thread_name && !thread_hooks[command_name][thread_name]) {
            thread_hooks[command_name][thread_name] = [];
        }

        thread_hooks[command_name][thread_name].push(func);

        return controller.studio;
    };



    controller.studio.before = function(command_name, func) {

        if (!before_hooks[command_name]) {
            before_hooks[command_name] = [];
        }

        before_hooks[command_name].push(func);

        return controller.studio;
    };

    controller.studio.after = function(command_name, func) {

        if (!after_hooks[command_name]) {
            after_hooks[command_name] = [];
        }

        after_hooks[command_name].push(func);

        return controller.studio;

    };

    function runHooks(hooks, convo, cb) {

        if (!hooks || !hooks.length) {
            return cb(convo);
        }

        var func = hooks.shift();

        func(convo, function() {
            if (hooks.length) {
                runHooks(hooks, convo, cb);
            } else {
                return cb(convo);
            }
        });
    }


    /* Fetch a script from Botkit Studio by name, then execute it.
     * returns a promise that resolves when the conversation is loaded and active */
    controller.studio.run = function(bot, input_text, user, channel, original_message) {

        return new Promise(function(resolve, reject) {

            controller.studio.get(bot, input_text, user, channel, original_message).then(function(convo) {
                convo.activate();
                resolve(convo);
            }).catch(function(err) {
                reject(err);
            });
        });

    };

    /* Fetch a script from Botkit Studio by name, but do not execute it.
     * returns a promise that resolves when the conversation is loaded
     * but developer still needs to call convo.activate() to put it in motion */
    controller.studio.get = function(bot, input_text, user, channel, original_message) {
        var context = {
            text: input_text,
            user: user,
            channel: channel,
            raw_message: original_message ? original_message.raw_message : null,
            original_message: original_message || null
        };
        return new Promise(function(resolve, reject) {
            controller.studio.getScript(bot, input_text, user).then(function(command) {
                controller.trigger('command_triggered', [bot, context, command]);
                controller.studio.compileScript(
                    bot,
                    context,
                    command.command,
                    command.script,
                    command.variables
                ).then(function(convo) {
                    convo.on('end', function(convo) {
                        runHooks(
                            after_hooks[command.command] ? after_hooks[command.command].slice() : [],
                            convo,
                            function(convo) {
                                controller.trigger('remote_command_end', [bot, context, command, convo]);
                            }
                        );
                    });
                    runHooks(
                        before_hooks[command.command] ? before_hooks[command.command].slice() : [],
                        convo,
                        function(convo) {
                            resolve(convo);
                        }
                    );
                }).catch(function(err) {
                    reject(err);
                });
            }).catch(function(err) {
                reject(err);
            });
        });
    };


    controller.studio.runTrigger = function(bot, input_text, user, channel, original_message) {
        var context = {
            text: input_text,
            user: user,
            channel: channel,
            raw_message: original_message ? original_message.raw_message : null,
            original_message: original_message || null
        };
        return new Promise(function(resolve, reject) {
            controller.studio.evaluateTrigger(bot, input_text, user).then(function(command) {
                if (command !== {} && command.id) {
                    controller.trigger('command_triggered', [bot, context, command]);
                    controller.studio.compileScript(
                        bot,
                        context,
                        command.command,
                        command.script,
                        command.variables
                    ).then(function(convo) {

                        convo.on('end', function(convo) {
                            runHooks(
                                after_hooks[command.command] ? after_hooks[command.command].slice() : [],
                                convo,
                                function(convo) {
                                    controller.trigger('remote_command_end', [bot, context, command, convo]);
                                }
                            );
                        });

                        runHooks(
                            before_hooks[command.command] ? before_hooks[command.command].slice() : [],
                            convo,
                            function(convo) {
                                convo.activate();
                                resolve(convo);
                            }
                        );
                    }).catch(function(err) {
                        reject(err);
                    });
                } else {
                    // return with no conversation
                    // allow developer to run a default script
                    resolve(null);
                }
            }).catch(function(err) {
                reject(err);
            });
        });

    };


    controller.studio.testTrigger = function(bot, input_text, user, channel) {
        var context = {
            text: input_text,
            user: user,
            channel: channel,
        };
        return new Promise(function(resolve, reject) {
            controller.studio.evaluateTrigger(bot, input_text, user).then(function(command) {
                if (command !== {} && command.id) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }).catch(function(err) {
                reject(err);
            });
        });

    };

    controller.studio.compileScript = function(bot, message, command_name, topics, vars) {
        function makeHandler(options, field) {
            var pattern = '';

            if (options.type == 'utterance') {
                pattern = controller.utterances[options.pattern];
            } else if (options.type == 'string') {
                pattern = '^' + options.pattern + '$';
            } else if (options.type == 'regex') {
                pattern = options.pattern;
            }

            return {
                pattern: pattern,
                default: options.default,
                callback: function(response, convo) {
                    var hooks = [];
                    if (field.key && answer_hooks[command_name] && answer_hooks[command_name][field.key]) {
                        hooks = answer_hooks[command_name][field.key].slice();
                    }
                    if (options.action != 'wait' && field.multiple) {
                        convo.responses[field.key].pop();
                    }

                    runHooks(hooks, convo, function(convo) {
                        switch (options.action) {
                            case 'next':
                                convo.next();
                            break;
                            case 'repeat':
                                // before continuing, repeat the last send message
                                // use sayFirst, so that it prepends it to the front of script
                                convo.sayFirst(convo.sent[convo.sent.length - 1]);
                                convo.next();
                            break;
                            case 'stop':
                                convo.stop();
                            break;
                            case 'wait':
                                convo.silentRepeat();
                            break;
                            default:
                                convo.changeTopic(options.action);
                            break;
                        }
                    });
                }
            };

        }

        return new Promise(function(resolve, reject) {
            bot.createConversation(message, function(err, convo) {

                if (err) {
                    return reject(err);
                }

                // 15 minute default timeout
                convo.setTimeout(controller.config.default_timeout || (15 * 60 * 1000));

                // process any variables values and entities that came pre-defined as part of the script
                if (vars && vars.length) {
                    for (var v = 0; v < vars.length; v++) {
                        if (vars[v].value) {

                            // set the key/value as a mustache variable
                            // accessible as {{vars.name}} in the templates
                            convo.setVar(vars[v].name, vars[v].value);

                            // also add this as an "answer" to a question
                            // thus making it available at {{responses.name}} and
                            // convo.extractResponse(name);
                            convo.responses[vars[v].name] = {
                                question: vars[v].name,
                                text: vars[v].value,
                            };
                        }
                    }
                }

                for (var t = 0; t < topics.length; t++) {
                    var topic = topics[t].topic;
                    for (var m = 0; m < topics[t].script.length; m++) {

                        var message = {};

                        if (topics[t].script[m].text) {
                            message.text = topics[t].script[m].text;
                        }

                        // handle platform specific fields
                        if (bot.type == 'ciscospark') {
                            if (topics[t].script[m].platforms && topics[t].script[m].platforms.ciscospark) {
                                // attach files.
                                if (topics[t].script[m].platforms.ciscospark.files) {
                                    message.files = [];
                                    for (var f = 0; f < topics[t].script[m].platforms.ciscospark.files.length; f++) {
                                        message.files.push(topics[t].script[m].platforms.ciscospark.files[f].url);
                                    }
                                }
                            }
                        }

                        if (bot.type == 'teams') {
                            if (topics[t].script[m].platforms && topics[t].script[m].platforms.teams) {
                                // create attachments in the Botkit message

                                if (topics[t].script[m].platforms && topics[t].script[m].platforms.teams.attachmentLayout) {
                                    message.attachmentLayout = topics[t].script[m].platforms && topics[t].script[m].platforms.teams.attachmentLayout;
                                }

                                if (topics[t].script[m].platforms.teams.attachments) {
                                    message.attachments = [];
                                    for (var a = 0; a < topics[t].script[m].platforms.teams.attachments.length; a++) {
                                        var data = topics[t].script[m].platforms.teams.attachments[a];
                                        var attachment = {};
                                        if (data.type == 'o365') {
                                            attachment.contentType = 'application/vnd.microsoft.card.O365Connector'; // + data.type,
                                            data['@type'] = 'MessageCard';
                                            data['@context'] = 'http://schema.org/extensions';
                                            delete(data.type);
                                            attachment.content = data;
                                        } else if (data.type != 'file') {
                                            attachment = bot.createAttachment(data.type, data);
                                        } else {
                                            attachment.contentType = data.contentType;
                                            attachment.contentUrl = data.contentUrl;
                                            attachment.name = data.name;

                                        }
                                        message.attachments.push(attachment);
                                    }
                                }
                            }
                        }

                        // handle Slack attachments
                        if (topics[t].script[m].attachments) {
                            message.attachments = topics[t].script[m].attachments;


                            // enable mrkdwn formatting in all fields of the attachment
                            for (var a = 0; a < message.attachments.length; a++) {
                                message.attachments[a].mrkdwn_in = ['text', 'pretext', 'fields'];
                                message.attachments[a].mrkdwn = true;
                            }
                        }

                        // handle Facebook attachments
                        if (topics[t].script[m].fb_attachment) {
                            var attachment = topics[t].script[m].fb_attachment;
                            if (attachment.template_type) {
                                if (attachment.template_type == 'button') {
                                    attachment.text = message.text;
                                }
                                message.attachment = {
                                    type: 'template',
                                    payload: attachment
                                };
                            } else if (attachment.type) {
                                message.attachment = attachment;
                            }

                            // blank text, not allowed with attachment
                            message.text = null;

                            // remove blank button array if specified
                            if (message.attachment.payload.elements) {
                                for (var e = 0; e < message.attachment.payload.elements.length; e++) {
                                    if (!message.attachment.payload.elements[e].buttons || !message.attachment.payload.elements[e].buttons.length) {
                                        delete(message.attachment.payload.elements[e].buttons);
                                    }
                                }
                            }

                        }

                        // handle Facebook quick replies
                        if (topics[t].script[m].quick_replies) {
                            var options = topics[t].script[m].quick_replies;
                            if (!message.quick_replies) {
                                message.quick_replies = [];
                            }
                            for (var o = 0; o < options.length; o++) {
                                message.quick_replies.push(options[o]);
                            }
                        }

                        // handle Facebook quick replies that are embedded in question options
                        if (topics[t].script[m].collect) {

                            var options = topics[t].script[m].collect.options || [];
                            if (options.length > 0) {
                                for (var o = 0; o < options.length; o++) {
                                    if (options[o].fb_quick_reply) {
                                        if (!message.quick_replies) {
                                            message.quick_replies = [];
                                        }
                                        message.quick_replies.push({
                                            title: options[o].pattern,
                                            payload: options[o].fb_quick_reply_payload,
                                            image_url: options[o].fb_quick_reply_image_url,
                                            content_type: options[o].fb_quick_reply_content_type,
                                        });
                                    }
                                }
                            }
                        }

                        if (topics[t].script[m].action) {
                            message.action = topics[t].script[m].action;
                        }

                        if (topics[t].script[m].collect) {
                            // this is a question message
                            var capture_options = {};
                            var handlers = [];
                            var options = topics[t].script[m].collect.options || [];
                            if (topics[t].script[m].collect.key) {
                                capture_options.key = topics[t].script[m].collect.key;
                            }

                            if (topics[t].script[m].collect.multiple) {
                                capture_options.multiple = true;
                            }

                            var default_found = false;
                            for (var o = 0; o < options.length; o++) {
                                var handler = makeHandler(options[o], capture_options);
                                handlers.push(handler);
                                if (options[o].default) {
                                    default_found = true;
                                }
                            }

                            // make sure there is a default
                            if (!default_found) {
                                handlers.push({
                                    default: true,
                                    callback: function(r, c) {

                                        runHooks(
                                            answer_hooks[command_name] ? answer_hooks[command_name].slice() : [],
                                            convo,
                                            function(convo) {
                                                c.next();
                                            }
                                        );
                                    }
                                });
                            }

                            convo.addQuestion(message, handlers, capture_options, topic);

                        } else {

                            // this is a simple message
                            convo.addMessage(message, topic);
                        }
                    }

                    // add thread hooks if they have been defined.
                    if (thread_hooks[command_name] && thread_hooks[command_name][topic]) {
                        for (var h = 0; h < thread_hooks[command_name][topic].length; h++) {
                            convo.beforeThread(topic, thread_hooks[command_name][topic][h]);
                        }
                    }

                }


                resolve(convo);
            });
        });
    };

    /* ----------------------------------------------------------------
     * Botkit Studio Stats
     * The features below this line pertain to communicating with Botkit Studio's
     * stats feature.
     * ---------------------------------------------------------------- */



    function statsAPI(bot, options, message) {
        var _STUDIO_STATS_API = controller.config.studio_stats_uri || 'https://stats.botkit.ai';
        options.uri = _STUDIO_STATS_API + '/api/v1/stats';

        return new Promise(function(resolve, reject) {

            var headers = {
                'content-type': 'application/json',
            };

            if (bot.config && bot.config.studio_token) {
                options.uri = options.uri + '?access_token=' + bot.config.studio_token;
            } else if (controller.config && controller.config.studio_token) {
                options.uri = options.uri + '?access_token=' + controller.config.studio_token;
            } else {
                // console.log('DEBUG: Making an unathenticated request to stats api');
            }

            options.headers = headers;
            var now = new Date();
            if (options.now) {
                now = options.now;
            }


            var stats_body = {};
            stats_body.botHash = botHash(bot);
            if (bot.type == 'slack' && bot.team_info) {
                stats_body.team = md5(bot.team_info.id);
            }

            if (bot.type == 'ciscospark' && message && message.raw_message && message.raw_message.orgId) {
                stats_body.team = md5(message.raw_message.orgId);
            }

            if (bot.type == 'teams' && bot.config.team) {
                stats_body.team = md5(bot.config.team);
            }

            stats_body.channel = options.form.channel;
            stats_body.user = options.form.user;
            stats_body.type = options.form.type;
            stats_body.time = now;
            stats_body.meta = {};
            stats_body.meta.user = options.form.user;
            stats_body.meta.channel = options.form.channel;
            if (options.form.final_thread) {
                stats_body.meta.final_thread = options.form.final_thread;
            }
            if (bot.botkit.config.clientId) {
                stats_body.meta.app = md5(bot.botkit.config.clientId);
            }
            stats_body.meta.timestamp = options.form.timestamp;
            stats_body.meta.bot_type = options.form.bot_type;
            stats_body.meta.conversation_length = options.form.conversation_length;
            stats_body.meta.status = options.form.status;
            stats_body.meta.type = options.form.type;
            stats_body.meta.command = options.form.command;
            options.form = stats_body;
            stats_body.meta.timestamp = options.now || now;
            request(options, function(err, res, body) {
                if (err) {
                    return reject(err);
                }

                var json = null;
                try {
                    json = JSON.parse(body);
                } catch (e) {
                }

                if (!json || json == null) {
                    return reject('Response from Botkit Studio API was empty or invalid JSON');
                } else if (json.error) {
                    return reject(json.error);
                } else {
                    resolve(json);
                }

            });
        });
    }

    /* generate an anonymous hash to uniquely identify this bot instance */
    function botHash(bot) {
        var x = '';
        switch (bot.type) {
            case 'slack':
                if (bot.config.token) {
                    x = md5(bot.config.token);
                } else {
                    x = 'non-rtm-bot';
                }
            break;

            case 'teams':
                x = md5(bot.identity.id);
            break;

            case 'fb':
                x = md5(bot.botkit.config.access_token);
            break;

            case 'twilioipm':
                x = md5(bot.config.TWILIO_IPM_SERVICE_SID);
            break;

            case 'twiliosms':
                x = md5(bot.botkit.config.account_sid);
            break;


            case 'ciscospark':
                x = md5(bot.botkit.config.ciscospark_access_token);
            break;

            default:
                x = 'unknown-bot-type';
            break;
        }
        return x;
    };


    /* Every time a bot spawns, Botkit calls home to identify this unique bot
     * so that the maintainers of Botkit can measure the size of the installed
     * userbase of Botkit-powered bots. */
    if (!controller.config.stats_optout) {

        controller.on('spawned', function(bot) {

            var data = {
                type: 'spawn',
                bot_type: bot.type,
            };
            controller.trigger('stats:spawned', bot);
            return statsAPI(bot, {
                method: 'post',
                form: data,
            });
        });


        controller.on('heard_trigger', function(bot, keywords, message) {
            var data = {
                type: 'heard_trigger',
                user: md5(message.user),
                channel: md5(message.channel),
                bot_type: bot.type,
            };
            controller.trigger('stats:heard_trigger', message);
            return statsAPI(bot, {
                method: 'post',
                form: data,
            }, message);
        });

        controller.on('command_triggered', function(bot, message, command) {
            var data = {
                type: 'command_triggered',
                now: message.now,
                user: md5(message.user),
                channel: md5(message.channel),
                command: command.command,
                timestamp: command.created,
                bot_type: bot.type,
            };
            controller.trigger('stats:command_triggered', message);
            return statsAPI(bot, {
                method: 'post',
                form: data,
            }, message);
        });

        controller.on('remote_command_end', function(bot, message, command, convo) {
            var data = {
                now: message.now,
                user: md5(message.user),
                channel: md5(message.channel),
                command: command.command,
                timestamp: command.created,
                conversation_length: convo.lastActive - convo.startTime,
                status: convo.status,
                type: 'remote_command_end',
                final_thread: convo.thread,
                bot_type: bot.type,
            };
            controller.trigger('stats:remote_command_end', message);
            return statsAPI(bot, {
                method: 'post',
                form: data,
            }, message);

        });

    }

};
