var Ws = require('ws');
var request = require('request');
var slackWebApi = require(__dirname + '/Slack_web_api.js');
var HttpsProxyAgent = require('https-proxy-agent');
var Back = require('back');


module.exports = function(botkit, config) {
    var bot = {
        botkit: botkit,
        config: config || {},
        utterances: botkit.utterances,
        api: slackWebApi(botkit, config || {}),
        identity: { // default identity values
            id: null,
            name: '',
        }
    };

    var pingIntervalId = null;
    var retryBackoff = null;

    // config.retry, can be Infinity too
    var retryEnabled = bot.config.retry ? true : false;
    var maxRetry = isNaN(bot.config.retry) || bot.config.retry <= 0 ? 3 : bot.config.retry;

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

        request.post(bot.config.incoming_webhook.url, function(err, res, body) {
            if (err) {
                botkit.debug('WEBHOOK ERROR', err);
                return cb && cb(err);
            }
            botkit.debug('WEBHOOK SUCCESS', body);
            cb && cb(null, body);
        }).form({ payload: JSON.stringify(options) });
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

        if (pingIntervalId) {
            clearInterval(pingIntervalId);
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
                if (err) {
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
        if (retryBackoff) {
            retryBackoff.close();
            retryBackoff = null;
        }
        bot.closeRTM();
        botkit.shutdown();
    };

    bot.startRTM = function(cb) {
        var lastPong = 0;
        bot.api.rtm.start({
            no_unreads: true,
            simple_latest: true,
        }, function(err, res) {
            if (err) {
                return cb && cb(err);
            }

            if (!res) {
                return cb && cb('Invalid response from rtm.start');
            }

            bot.identity = res.self;
            bot.team_info = res.team;

            /**
             * Also available:
             * res.users, res.channels, res.groups, res.ims,
             * res.bots
             *
             * Could be stored & cached for later use.
             */

            botkit.log.notice('** BOT ID:', bot.identity.name, '...attempting to connect to RTM!');

            var agent = null;
            var proxyUrl = process.env.https_proxy || process.env.http_proxy;
            if (proxyUrl) {
                agent = new HttpsProxyAgent(proxyUrl);
            }

            bot.rtm = new Ws(res.url, null, {agent: agent});
            bot.msgcount = 1;

            bot.rtm.on('pong', function(obj) {
                lastPong = Date.now();
                botkit.debug('PONG received');
            });

            bot.rtm.on('open', function() {
                botkit.log.notice('RTM websocket opened');

                pingIntervalId = setInterval(function() {
                    if (lastPong && lastPong + 12000 < Date.now()) {
                        var err = new Error('Stale RTM connection, closing RTM');
                        botkit.log.error(err)
                        bot.closeRTM(err);
                        clearInterval(pingIntervalId);
                        return;
                    }

                    botkit.debug('PING sent');
                    bot.rtm.ping(null, null, true);
                }, 5000);

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
                    if (message != null) {
                        botkit.receiveMessage(bot, message);
                    }
                });

                botkit.startTicking();

                cb && cb(null, bot, res);
            });

            bot.rtm.on('error', function(err) {
                botkit.log.error('RTM websocket error!', err);
                if (pingIntervalId) {
                    clearInterval(pingIntervalId);
                }
                botkit.trigger('rtm_close', [bot, err]);
            });

            bot.rtm.on('close', function(code, message) {
                botkit.log.notice('RTM close event: ' + code + ' : ' + message);
                if (pingIntervalId) {
                    clearInterval(pingIntervalId);
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
        botkit.startTask(this, message, function(task, convo) {
            bot._startDM(task, message.user, function(err, dm) {
                convo.stop();
                cb(err, dm);
            });
        });
    };

    bot.startConversation = function(message, cb) {
        botkit.startConversation(this, message, cb);
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
        botkit.debug('SAY', message);

        /**
         * Construct a valid slack message.
         */
        var slack_message = {
            type: message.type || 'message',
            channel: message.channel,
            text: message.text || null,
            username: message.username || null,
            parse: message.parse || null,
            link_names: message.link_names || null,
            attachments: message.attachments ?
                JSON.stringify(message.attachments) : null,
            unfurl_links: typeof message.unfurl_links !== 'undefined' ? message.unfurl_links : null,
            unfurl_media: typeof message.unfurl_media !== 'undefined' ? message.unfurl_media : null,
            icon_url: message.icon_url || null,
            icon_emoji: message.icon_emoji || null,
        };
        bot.msgcount++;

        if (message.icon_url || message.icon_emoji || message.username) {
            slack_message.as_user = false;
        } else {
            slack_message.as_user = message.as_user || true;
        }

        /**
         * These options are not supported by the RTM
         * so if they are specified, we use the web API to send messages.
         */
        if (message.attachments || message.icon_emoji ||
            message.username || message.icon_url) {

            if (!bot.config.token) {
                throw new Error('Cannot use web API to send messages.');
            }

            bot.api.chat.postMessage(slack_message, function(err, res) {
                if (err) {
                    cb && cb(err);
                } else {
                    cb && cb(null, res);
                }
            });

        } else {
            if (!bot.rtm)
                throw new Error('Cannot use the RTM API to send messages.');

            slack_message.id = message.id || bot.msgcount;


            try {
                bot.rtm.send(JSON.stringify(slack_message), function(err) {
                    if (err) {
                        cb && cb(err);
                    } else {
                        cb && cb();
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

            msg.response_type = 'in_channel';
            bot.res.json(msg);
            cb && cb();
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

            msg.response_type = 'in_channel';
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

            msg.response_type = 'ephemeral';
            bot.res.json(msg);

            cb && cb();
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

            msg.response_type = 'ephemeral';

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
        }
    };

    bot.reply = function(src, resp, cb) {
        var msg = {};

        if (typeof(resp) == 'string') {
            msg.text = resp;
        } else {
            msg = resp;
        }

        msg.channel = src.channel;

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
        botkit.debug('CUSTOM FIND CONVO', message.user, message.channel);
        if (message.type == 'message' || message.type == 'slash_command' ||
            message.type == 'outgoing_webhook') {
            for (var t = 0; t < botkit.tasks.length; t++) {
                for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
                    if (
                        botkit.tasks[t].convos[c].isActive() &&
                        botkit.tasks[t].convos[c].source_message.user == message.user &&
                            botkit.tasks[t].convos[c].source_message.channel == message.channel
                    ) {
                        botkit.debug('FOUND EXISTING CONVO!');

                        // modify message text to prune off the bot's name (@bot hey -> hey)
                        // and trim whitespace that is sometimes added
                        // this would otherwise happen in the handleSlackEvents function
                        // which does not get called for messages attached to conversations.

                        if (message.text) {
                            message.text = message.text.trim();
                        }

                        var direct_mention = new RegExp('^\<\@' + bot.identity.id + '\>', 'i');

                        message.text = message.text.replace(direct_mention, '')
                        .replace(/^\s+/, '').replace(/^\:\s+/, '').replace(/^\s+/, '');

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
