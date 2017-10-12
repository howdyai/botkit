var Ws = require('ws');
var request = require('request');
var slackWebApi = require(__dirname + '/Slack_web_api.js');
var HttpsProxyAgent = require('https-proxy-agent');
var Back = require('back');

module.exports = function(botkit, config) {
    var bot = {
        type: 'slack',
        botkit: botkit,
        config: config || {},
        utterances: botkit.utterances,
        api: slackWebApi(botkit, config || {}),
        identity: { // default identity values
            id: null,
            name: '',
        }
    };

    // Set when destroy() is called - prevents a reconnect from completing
    // if it was fired off prior to destroy being called
    var destroyed = false;
    var pingTimeoutId = null;
    var retryBackoff = null;

    // config.retry, can be Infinity too
    var retryEnabled = bot.config.retry ? true : (botkit.config.retry ? true : false);
    var maxRetry = null;
    if (bot.config.retry) {
        maxRetry = isNaN(bot.config.retry) || bot.config.retry <= 0 ? 3 : bot.config.retry;
    } else if (botkit.config.retry) {
        maxRetry = isNaN(botkit.config.retry) || botkit.config.retry <= 0 ? 3 : botkit.config.retry;
    }

    /**
     * Set up API to send incoming webhook
     */
    bot.configureIncomingWebhook = function(options) {
        if (!options.url)
            throw new Error('No incoming webhook URL specified!');

        bot.config.incoming_webhook = options;

        return bot;
    };

    bot.sendWebhook = function(options, cb) {
        if (!bot.config.incoming_webhook || !bot.config.incoming_webhook.url) {
            botkit.debug('CANNOT SEND WEBHOOK!!');

            return cb && cb('No webhook url specified');
        }

        botkit.middleware.send.run(bot, options, function(err, bot, options) {
            request.post(bot.config.incoming_webhook.url, function(err, res, body) {
                if (err) {
                    botkit.debug('WEBHOOK ERROR', err);
                    return cb && cb(err);
                }
                botkit.debug('WEBHOOK SUCCESS', body);
                cb && cb(null, body);
            }).form({ payload: JSON.stringify(options) });
        });
    };

    bot.configureRTM = function(config) {
        bot.config.token = config.token;
        return bot;
    };

    bot.closeRTM = function(err) {
        if (bot.rtm) {
            bot.rtm.removeAllListeners();
            bot.rtm.close();
        }

        if (pingTimeoutId) {
            clearTimeout(pingTimeoutId);
        }

        botkit.trigger('rtm_close', [bot, err]);

        // only retry, if enabled, when there was an error
        if (err && retryEnabled) {
            reconnect();
        }
    };


    function reconnect(err) {
        var options = {
            minDelay: 1000,
            maxDelay: 30000,
            retries: maxRetry
        };
        var back = retryBackoff || (retryBackoff = new Back(options));
        return back.backoff(function(fail) {
            if (fail) {
                botkit.log.error('** BOT ID:', bot.identity.name, '...reconnect failed after #' +
                    back.settings.attempt + ' attempts and ' + back.settings.timeout + 'ms');
                botkit.trigger('rtm_reconnect_failed', [bot, err]);
                return;
            }

            botkit.log.notice('** BOT ID:', bot.identity.name, '...reconnect attempt #' +
                back.settings.attempt + ' of ' + options.retries + ' being made after ' + back.settings.timeout + 'ms');
            bot.startRTM(function(err) {
                if (err && !destroyed) {
                    return reconnect(err);
                }
                retryBackoff = null;
            });
        });
    }

    /**
     * Shutdown and cleanup the spawned worker
     */
    bot.destroy = function() {
        // this prevents a startRTM from completing if it was fired off
        // prior to destroy being called
        destroyed = true;
        if (retryBackoff) {
            retryBackoff.close();
            retryBackoff = null;
        }
        bot.closeRTM();
        botkit.shutdown();
    };

    bot.startRTM = function(cb) {
        var lastPong = 0;
        bot.api.rtm.connect({}, function(err, res) {
            if (err) {
                return cb && cb(err);
            }

            if (!res) {
                return cb && cb('Invalid response from rtm.start');
            }

            bot.identity = res.self;
            bot.team_info = res.team;

            // Bail out if destroy() was called
            if (destroyed) {
                botkit.log.notice('Ignoring rtm.start response, bot was destroyed');
                return cb('Ignoring rtm.start response, bot was destroyed');
            }

            botkit.log.notice('** BOT ID:', bot.identity.name, '...attempting to connect to RTM!');

            var agent = null;
            var proxyUrl = process.env.https_proxy || process.env.http_proxy;
            if (proxyUrl) {
                agent = new HttpsProxyAgent(proxyUrl);
            }

            bot.rtm = new Ws(res.url, null, {
                agent: agent
            });
            bot.msgcount = 1;

            bot.rtm.on('pong', function(obj) {
                lastPong = Date.now();
            });

            bot.rtm.on('open', function() {
                botkit.log.notice('RTM websocket opened');

                var pinger = function() {
                    var pongTimeout = bot.botkit.config.stale_connection_timeout || 12000;
                    if (lastPong && lastPong + pongTimeout < Date.now()) {
                        var err = new Error('Stale RTM connection, closing RTM');
                        botkit.log.error(err);
                        bot.closeRTM(err);
                        clearTimeout(pingTimeoutId);
                        return;
                    }

                    bot.rtm.ping();
                    pingTimeoutId = setTimeout(pinger, 5000);
                };

                pingTimeoutId = setTimeout(pinger, 5000);

                botkit.trigger('rtm_open', [bot]);
                bot.rtm.on('message', function(data, flags) {

                    var message = null;
                    try {
                        message = JSON.parse(data);
                    } catch (err) {
                        console.log('** RECEIVED BAD JSON FROM SLACK');
                    }
                    /**
                     * Lets construct a nice quasi-standard botkit message
                     * it leaves the main slack message at the root
                     * but adds in additional fields for internal use!
                     * (including the teams api details)
                     */
                    if (message != null && bot.botkit.config.rtm_receive_messages) {
                        botkit.ingest(bot, message, bot.rtm);
                    }
                });

                botkit.startTicking();

                cb && cb(null, bot, res);
            });

            bot.rtm.on('error', function(err) {
                botkit.log.error('RTM websocket error!', err);
                if (pingTimeoutId) {
                    clearTimeout(pingTimeoutId);
                }
                botkit.trigger('rtm_close', [bot, err]);
            });

            bot.rtm.on('close', function(code, message) {
                botkit.log.notice('RTM close event: ' + code + ' : ' + message);
                if (pingTimeoutId) {
                    clearTimeout(pingTimeoutId);
                }
                botkit.trigger('rtm_close', [bot]);

                /**
                 * CLOSE_ABNORMAL error
                 * wasn't closed explicitly, should attempt to reconnect
                 */
                if (code === 1006) {
                    botkit.log.error('Abnormal websocket close event, attempting to reconnect');
                    reconnect();
                }
            });
        });

        return bot;
    };

    bot.identifyBot = function(cb) {
        var data;
        if (bot.identity) {
            data = {
                name: bot.identity.name,
                id: bot.identity.id,
                team_id: bot.identifyTeam()
            };
            cb && cb(null, data);
            return data;
        } else {
            /**
             * Note: Are there scenarios other than the RTM
             * where we might pull identity info, perhaps from
             * bot.api.auth.test on a given token?
             */
            cb && cb('Identity Unknown: Not using RTM api');
            return null;
        };
    };

    bot.identifyTeam = function(cb) {
        if (bot.team_info) {
            cb && cb(null, bot.team_info.id);
            return bot.team_info.id;
        }

        /**
         * Note: Are there scenarios other than the RTM
         * where we might pull identity info, perhaps from
         * bot.api.auth.test on a given token?
         */
        cb && cb('Unknown Team!');
        return null;
    };

    /**
     * Convenience method for creating a DM convo.
     */
    bot.startPrivateConversation = function(message, cb) {
        bot.api.im.open({ user: message.user }, function(err, channel) {
            if (err) return cb(err);

            message.channel = channel.channel.id;

            botkit.startTask(bot, message, function(task, convo) {
                cb(null, convo);
            });
        });
    };

    bot.startConversationInThread = function(message, cb) {
        // make replies happen in a thread
        if (!message.thread_ts) {
            message.thread_ts = message.ts;
        }
        botkit.startConversation(this, message, cb);
    };

    bot.createPrivateConversation = function(message, cb) {
        bot.api.im.open({ user: message.user }, function(err, channel) {
            if (err) return cb(err);

            message.channel = channel.channel.id;

            botkit.createConversation(bot, message, cb);
        });
    };

    bot.createConversationInThread = function(message, cb) {
        // make replies happen in a thread
        if (!message.thread_ts) {
            message.thread_ts = message.ts;
        }
        botkit.createConversation(this, message, cb);
    };


    /**
     * Convenience method for creating a DM convo.
     */
    bot._startDM = function(task, user_id, cb) {
        bot.api.im.open({ user: user_id }, function(err, channel) {
            if (err) return cb(err);

            cb(null, task.startConversation({
                channel: channel.channel.id,
                user: user_id
            }));
        });
    };

    bot.send = function(message, cb) {
        if (message.ephemeral) {
            bot.sendEphemeral(message, cb);
            return;
        }
        botkit.debug('SAY', message);

        bot.msgcount++;

        /**
         * Use the web api to send messages unless otherwise specified
         * OR if one of the fields that is only supported by the web api is present
         */
        if (
            botkit.config.send_via_rtm !== true && message.type !== 'typing' ||
            message.attachments || message.icon_emoji ||
            message.username || message.icon_url) {

            if (!bot.config.token) {
                throw new Error('Cannot use web API to send messages.');
            }

            bot.api.chat.postMessage(message, function(err, res) {
                if (err) {
                    cb && cb(err);
                } else {
                    cb && cb(null, res);
                }
            });

        } else {
            if (!bot.rtm)
                throw new Error('Cannot use the RTM API to send messages.');

            message.id = message.id || bot.msgcount;


            try {
                bot.rtm.send(JSON.stringify(message), function(err) {
                    if (err) {
                        cb && cb(err);
                    } else {
                        cb && cb(null, message);
                    }
                });
            } catch (err) {
                /**
                 * The RTM failed and for some reason it didn't get caught
                 * elsewhere. This happens sometimes when the rtm has closed but
                 * We are sending messages anyways.
                 * Bot probably needs to reconnect!
                 */
                cb && cb(err);
            }
        }
    };
    bot.sendEphemeral = function(message, cb) {
        botkit.debug('SAY EPHEMERAL', message);

        if (!bot.config.token) {
            throw new Error('Cannot use web API to send messages.');
        }

        bot.api.chat.postEphemeral(message, function(err, res) {
            if (err) {
                cb && cb(err);
            } else {
                cb && cb(null, res);
            }
        });
    };

    /**
    * Allows responding to slash commands and interactive messages with a plain
    * 200 OK (without any text or attachments).
    *
    * @param {function} cb - An optional callback function called at the end of execution.
    * The callback is passed an optional Error object.
    */
    bot.replyAcknowledge = function(cb) {
        if (!bot.res) {
            cb && cb(new Error('No web response object found'));
        } else {
            bot.res.end();

            cb && cb();
        }
    };

    bot.replyPublic = function(src, resp, cb) {
        if (!bot.res) {
            cb && cb('No web response object found');
        } else {
            var msg = {};

            if (typeof(resp) == 'string') {
                msg.text = resp;
            } else {
                msg = resp;
            }

            msg.channel = src.channel;

            // if source message is in a thread, reply should also be in the thread
            if (src.thread_ts) {
                msg.thread_ts = src.thread_ts;
            }

            msg.response_type = 'in_channel';
            msg.to = src.user;

            botkit.middleware.send.run(bot, msg, function(err, bot, msg) {
                bot.res.json(msg);
                cb  && cb();
            });
        }
    };

    bot.replyPublicDelayed = function(src, resp, cb) {
        if (!src.response_url) {
            cb && cb('No response_url found');
        } else {
            var msg = {};

            if (typeof(resp) == 'string') {
                msg.text = resp;
            } else {
                msg = resp;
            }

            msg.channel = src.channel;
            msg.to = src.user;

            // if source message is in a thread, reply should also be in the thread
            if (src.thread_ts) {
                msg.thread_ts = src.thread_ts;
            }

            msg.response_type = 'in_channel';

            botkit.middleware.send.run(bot, msg, function(err, bot, msg) {

                var requestOptions = {
                    uri: src.response_url,
                    method: 'POST',
                    json: msg
                };
                request(requestOptions, function(err, resp, body) {
                    /**
                     * Do something?
                     */
                    if (err) {
                        botkit.log.error('Error sending slash command response:', err);
                        cb && cb(err);
                    } else {
                        cb && cb();
                    }
                });
            });
        }
    };

    bot.replyPrivate = function(src, resp, cb) {
        if (!bot.res) {
            cb && cb('No web response object found');
        } else {
            var msg = {};

            if (typeof(resp) == 'string') {
                msg.text = resp;
            } else {
                msg = resp;
            }

            msg.channel = src.channel;
            msg.to = src.user;

            // if source message is in a thread, reply should also be in the thread
            if (src.thread_ts) {
                msg.thread_ts = src.thread_ts;
            }

            msg.response_type = 'ephemeral';
            botkit.middleware.send.run(bot, msg, function(err, bot, msg) {
                bot.res.json(msg);
                cb && cb();
            });
        }
    };

    bot.replyPrivateDelayed = function(src, resp, cb) {
        if (!src.response_url) {
            cb && cb('No response_url found');
        } else {
            var msg = {};

            if (typeof(resp) == 'string') {
                msg.text = resp;
            } else {
                msg = resp;
            }

            msg.channel = src.channel;
            msg.to = src.user;

            // if source message is in a thread, reply should also be in the thread
            if (src.thread_ts) {
                msg.thread_ts = src.thread_ts;
            }

            msg.response_type = 'ephemeral';

            botkit.middleware.send.run(bot, msg, function(err, bot, msg) {
                var requestOptions = {
                    uri: src.response_url,
                    method: 'POST',
                    json: msg
                };
                request(requestOptions, function(err, resp, body) {
                    /**
                     * Do something?
                     */
                    if (err) {
                        botkit.log.error('Error sending slash command response:', err);
                        cb && cb(err);
                    } else {
                        cb && cb();
                    }
                });
            });
        }
    };

    bot.replyInteractive = function(src, resp, cb) {
        if (!src.response_url) {
            cb && cb('No response_url found');
        } else {
            var msg = {};

            if (typeof(resp) == 'string') {
                msg.text = resp;
            } else {
                msg = resp;
            }

            msg.channel = src.channel;
            msg.to = src.user;

            // if source message is in a thread, reply should also be in the thread
            if (src.thread_ts) {
                msg.thread_ts = src.thread_ts;
            }

            botkit.middleware.send.run(bot, msg, function(err, bot, msg) {
                var requestOptions = {
                    uri: src.response_url,
                    method: 'POST',
                    json: msg
                };
                request(requestOptions, function(err, resp, body) {
                    /**
                     * Do something?
                     */
                    if (err) {
                        botkit.log.error('Error sending interactive message response:', err);
                        cb && cb(err);
                    } else {
                        cb && cb();
                    }
                });
            });
        }
    };

    bot.dialogOk = function() {
        bot.res.send('');
    };

    bot.dialogError = function(errors) {
        if (!errors) {
            errors = [];
        }

        if (Object.prototype.toString.call(errors) !== '[object Array]') {
            errors = [errors];
        }

        bot.res.json({
            errors: errors
        });
    };

    bot.replyWithDialog = function(src, dialog_obj, cb) {

        var msg = {
            trigger_id: src.trigger_id,
            dialog: JSON.stringify(dialog_obj)
        };

        botkit.middleware.send.run(bot, msg, function(err, bot, msg) {
            bot.api.dialog.open(msg, cb);
        });
    };


    /* helper functions for creating dialog attachments */
    bot.createDialog = function(title, callback_id, submit_label, elements) {

        var obj = {
            data: {
                title: title,
                callback_id: callback_id,
                submit_label: submit_label || null,
                elements: elements || [],
            },
            title: function(v) {
                this.data.title = v;
                return this;
            },
            callback_id: function(v) {
                this.data.callback_id = v;
                return this;
            },
            submit_label: function(v) {
                this.data.submit_label = v;
                return this;
            },
            addText: function(label, name, value, options, subtype) {

                var element = (typeof(label) === 'object') ? label : {
                    label: label,
                    name: name,
                    value: value,
                    type: 'text',
                    subtype: subtype || null,
                };

                if (typeof(options) === 'object') {
                    for (var key in options) {
                        element[key] = options[key];
                    }
                }

                this.data.elements.push(element);
                return this;
            },
            addEmail: function(label, name, value, options) {
                return this.addText(label, name, value, options, 'email');
            },
            addNumber: function(label, name, value, options) {
                return this.addText(label, name, value, options, 'number');
            },
            addTel: function(label, name, value, options) {
                return this.addText(label, name, value, options, 'tel');
            },
            addUrl: function(label, name, value, options) {
                return this.addText(label, name, value, options, 'url');
            },
            addTextarea: function(label, name, value, options, subtype) {

                var element = (typeof(label) === 'object') ? label : {
                    label: label,
                    name: name,
                    value: value,
                    type: 'textarea',
                    subtype: subtype || null,
                };

                if (typeof(options) === 'object') {
                    for (var key in options) {
                        element[key] = options[key];
                    }
                }

                this.data.elements.push(element);
                return this;
            },
            addSelect: function(label, name, value, option_list, options) {
                var element = {
                    label: label,
                    name: name,
                    value: value,
                    options: option_list,
                    type: 'select',
                };
                if (typeof(options) === 'object') {
                    for (var key in options) {
                        element[key] = options[key];
                    }
                }


                this.data.elements.push(element);
                return this;
            },
            asString: function() {
                return JSON.stringify(this.data, null, 2);
            },
            asObject: function() {
                return this.data;
            }
        };

        return obj;

    };


    bot.reply = function(src, resp, cb) {
        var msg = {};

        if (typeof(resp) == 'string') {
            msg.text = resp;
        } else {
            msg = resp;
        }

        msg.channel = src.channel;
        msg.to = src.user;

        // if source message is in a thread, reply should also be in the thread
        if (src.thread_ts) {
            msg.thread_ts = src.thread_ts;
        }
        if (msg.ephemeral && !msg.user) {
            msg.user = src.user;
            msg.as_user = true;
        }

        bot.say(msg, cb);
    };

    bot.whisper = function(src, resp, cb) {
        var msg = {};

        if (typeof(resp) == 'string') {
            msg.text = resp;
        } else {
            msg = resp;
        }

        msg.channel = src.channel;
        msg.user = src.user;
        msg.as_user = true;
        msg.ephemeral = true;

        bot.say(msg, cb);
    };

    bot.replyInThread = function(src, resp, cb) {
        var msg = {};

        if (typeof(resp) == 'string') {
            msg.text = resp;
        } else {
            msg = resp;
        }

        msg.channel = src.channel;
        msg.to = src.user;

        // to create a thread, set the original message as the parent
        msg.thread_ts = src.thread_ts ? src.thread_ts : src.ts;

        bot.say(msg, cb);
    };

    /**
     * sends a typing message to the source channel
     *
     * @param {Object} src message source
     */
    bot.startTyping = function(src) {
        bot.reply(src, { type: 'typing' });
    };

    /**
     * replies with message after typing delay
     *
     * @param {Object} src message source
     * @param {(string|Object)} resp string or object
     * @param {function} cb optional request callback
     */
    bot.replyWithTyping = function(src, resp, cb) {
        var text;

        if (typeof(resp) == 'string') {
            text = resp;
        } else {
            text = resp.text;
        }

        var typingLength = 1200 / 60 * text.length;
        typingLength = typingLength > 2000 ? 2000 : typingLength;

        bot.startTyping(src);

        setTimeout(function() {
            bot.reply(src, resp, cb);
        }, typingLength);
    };

    /**
     * replies with message, performs arbitrary task, then updates reply message
     * note: don't use this as a replacement for the `typing` event
     *
     * @param {Object} src - message source
     * @param {(string|Object)} resp - response string or object
     * @param {function} [cb] - updater callback
     */
    bot.replyAndUpdate = function(src, resp, cb) {
        try {
            resp = typeof resp === 'string' ? { text: resp } : resp;
            // trick bot.reply into using web API instead of RTM
            resp.attachments = resp.attachments || [];
        } catch (err) {
            return cb && cb(err);
        }
        // send the "updatable" message
        return bot.reply(src, resp, function(err, src) {
            if (err) return cb && cb(err);

            // if provided, call the updater callback - it controls how and when to update the "updatable" message
            return cb && cb(null, src, function(resp, cb) {
                try {
                    // format the "update" message to target the "updatable" message
                    resp = typeof resp === 'string' ? { text: resp } : resp;
                    resp.ts = src.ts;
                    resp.channel = src.channel;
                    resp.attachments = JSON.stringify(resp.attachments || []);
                } catch (err) {
                    return cb && cb(err);
                }
                // update the "updatable" message with the "update" message
                return bot.api.chat.update(resp, function(err, json) {
                    return cb && cb(err, json);
                });
            });
        });
    };

    /**
     * This handles the particulars of finding an existing conversation or
     * topic to fit the message into...
     */
    bot.findConversation = function(message, cb) {
        botkit.debug('CUSTOM FIND CONVO', message.user, message.channel, message.type);
        if (message.type == 'direct_message' || message.type == 'direct_mention' || message.type == 'ambient' || message.type == 'mention' || message.type == 'slash_command' ||
            message.type == 'outgoing_webhook' || message.type == 'interactive_message_callback') {
            for (var t = 0; t < botkit.tasks.length; t++) {
                for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
                    if (
                        botkit.tasks[t].convos[c].isActive() &&
                        botkit.tasks[t].convos[c].source_message.user == message.user &&
                            botkit.tasks[t].convos[c].source_message.channel == message.channel &&
                            botkit.tasks[t].convos[c].source_message.thread_ts == message.thread_ts
                    ) {
                        botkit.debug('FOUND EXISTING CONVO!');
                        cb(botkit.tasks[t].convos[c]);
                        return;
                    }
                }
            }
        }

        cb();
    };

    if (bot.config.incoming_webhook)
        bot.configureIncomingWebhook(config.incoming_webhook);

    if (bot.config.bot)
        bot.configureRTM(config.bot);

    return bot;
};
