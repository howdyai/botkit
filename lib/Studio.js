var request = require('request');
var Promise = require('promise');
var md5 = require('md5');

module.exports = function(controller) {
    var before_hooks = {};
    var after_hooks = {};
    var answer_hooks = {};


    // define a place for the studio specific features to live.
    controller.studio = {};


    function studioAPI(bot, options) {
        var _STUDIO_COMMAND_API = controller.config.studio_command_uri || 'https://api.botkit.ai';
        options.uri = _STUDIO_COMMAND_API + options.uri;
        return new Promise(function(resolve, reject) {
            var headers = {
                'content-type': 'application/json',
            };
            if (bot.config.studio_token) {
                options.uri = options.uri + '?access_token=' + bot.config.studio_token;
            } else if (controller.config.studio_token) {
                options.uri = options.uri + '?access_token=' + controller.config.studio_token;
            } else {
                throw new Error('No Botkit Studio Token');
            }
            options.headers = headers;
            request(options, function(err, res, body) {
                if (err) {
                    console.log('Error in Botkit Studio:', err);
                    return reject(err);
                }
                try {
                    json = JSON.parse(body);
                    if (json.error) {
                        console.log('Error in Botkit Studio:', json.error);
                        reject(json.error);
                    } else {
                        resolve(json);
                    }
                } catch (e) {
                    console.log('Error in Botkit Studio:', e);
                    return reject('Invalid JSON');
                }
            });
        });
    }

    /* ----------------------------------------------------------------
     * Botkit Studio Script Services
     * The features in this section grant access to Botkit Studio's
     * script and trigger services
     * ---------------------------------------------------------------- */


    controller.studio.evaluateTrigger = function(bot, text) {
        var url = '/api/v1/commands/triggers';
        return studioAPI(bot, {
            uri: url,
            method: 'post',
            form: {
                triggers: text
            },
        });
    };

    // load a script from the pro service
    controller.studio.getScript = function(bot, text) {
        var url = '/api/v1/commands/name';
        return studioAPI(bot, {
            uri: url,
            method: 'post',
            form: {
                command: text
            },
        });
    };


    // these are middleware functions
    controller.studio.validate = function(command_name, key, func) {

        if (!answer_hooks[command_name]) {
            answer_hooks[command_name] = [];

        }
        if (key && !answer_hooks[command_name][key]) {
            answer_hooks[command_name][key] = [];
            answer_hooks[command_name][key].push(func);
        }

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
    controller.studio.run = function(bot, input_text, user, channel) {

        return new Promise(function(resolve, reject) {

            controller.studio.get(bot, input_text, user, channel).then(function(convo) {
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
    controller.studio.get = function(bot, input_text, user, channel) {
        var context = {
            text: input_text,
            user: user,
            channel: channel,
        };
        return new Promise(function(resolve, reject) {
            controller.studio.getScript(bot, input_text).then(function(command) {
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
            });
        });
    };


    controller.studio.runTrigger = function(bot, input_text, user, channel) {
        var context = {
            text: input_text,
            user: user,
            channel: channel,
        };
        return new Promise(function(resolve, reject) {
            controller.studio.evaluateTrigger(bot, input_text).then(function(command) {
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
                    // do nothing
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
            controller.studio.evaluateTrigger(bot, input_text).then(function(command) {
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
                                convo.repeat();
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

                convo.setTimeout(controller.config.default_timeout || (15 * 60 * 1000)); // 15 minute default timeout
                if (err) {
                    return reject(err);
                }
                for (var t = 0; t < topics.length; t++) {
                    var topic = topics[t].topic;
                    for (var m = 0; m < topics[t].script.length; m++) {

                        var message = {};

                        if (topics[t].script[m].text) {
                            message.text = topics[t].script[m].text;
                        }
                        if (topics[t].script[m].attachments) {
                            message.attachments = topics[t].script[m].attachments;


                            // enable mrkdwn formatting in all fields of the attachment
                            for (var a = 0; a < message.attachments.length; a++) {
                                message.attachments[a].mrkdwn_in = ['text', 'pretext', 'fields'];
                                message.attachments[a].mrkdwn = true;
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



    function statsAPI(bot, options) {
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
            stats_body.channel = options.form.channel;
            stats_body.user = options.form.user;
            stats_body.type = options.form.type;
            stats_body.time = now;
            stats_body.meta = {};
            stats_body.meta.user = options.form.user;
            stats_body.meta.channel = options.form.channel;
            stats_body.meta.timestamp = options.form.timestamp;
            stats_body.meta.bot_type = options.form.bot_type,
                stats_body.meta.conversation_length = options.form.conversation_length;
            stats_body.meta.status = options.form.status;
            stats_body.meta.type = options.form.type;
            stats_body.meta.command = options.form.command;
            options.form = stats_body;
            stats_body.meta.timestamp = options.now || now;
            request(options, function(err, res, body) {
                if (err) {
                    console.log('Error in Botkit Studio Stats:', err);
                    return reject(err);
                }
                try {
                    json = JSON.parse(body);
                    if (json.error) {
                        console.log('Error in Botkit Studio Stats:', json.error);
                        reject(json.error);
                    } else {
                        //  console.log('** Stat recorded: ', options.form.type);
                        resolve(json);
                    }
                } catch (e) {
                    console.log('Error in Botkit Studio Stats:', e);
                    return reject('Invalid JSON');
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

            case 'fb':
                x = md5(bot.botkit.config.access_token);
                break;

            case 'twilioipm':
                x = md5(bot.config.TWILIO_IPM_SERVICE_SID);
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
            });
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
            });
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
                bot_type: bot.type,
            };
            controller.trigger('stats:remote_command_end', message);
            return statsAPI(bot, {
                method: 'post',
                form: data,
            });

        });

    }

};
