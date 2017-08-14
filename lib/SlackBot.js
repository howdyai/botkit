var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var querystring = require('querystring');
var async = require('async');

function Slackbot(configuration) {

    // Create a core botkit bot
    var slack_botkit = Botkit(configuration || {});

    // Set some default configurations unless they've already been set.

    // Should the RTM connections ingest received messages
    // Developers using the new Events API will set this to false
    // This allows an RTM connection to be kept alive (so bot appears online)
    // but receive messages only via events api
    if (slack_botkit.config.rtm_receive_messages === undefined) {
        slack_botkit.config.rtm_receive_messages = true;
    }

    var spawned_bots = [];

    // customize the bot definition, which will be used when new connections
    // spawn!
    slack_botkit.defineBot(require(__dirname + '/Slackbot_worker.js'));

    // Middleware to track spawned bots and connect existing RTM bots to incoming webhooks
    slack_botkit.middleware.spawn.use(function(worker, next) {

        // lets first check and make sure we don't already have a bot
        // for this team! If we already have an RTM connection, copy it
        // into the new bot so it can be used for replies.

        var existing_bot = null;
        if (worker.config.id) {
            for (var b = 0; b < spawned_bots.length; b++) {
                if (spawned_bots[b].config.id) {
                    if (spawned_bots[b].config.id == worker.config.id) {
                        // WAIT! We already have a bot spawned here.
                        // so instead of using the new one, use the exist one.
                        existing_bot = spawned_bots[b];
                    }
                }
            }
        }

        if (!existing_bot && worker.config.id) {
            spawned_bots.push(worker);
        } else if (existing_bot) {
            if (existing_bot.rtm) {
                worker.rtm = existing_bot.rtm;
            }
        }
        next();

    });

    // set up configuration for oauth
    // slack_app_config should contain
    // { clientId, clientSecret, scopes}
    // https://api.slack.com/docs/oauth-scopes
    slack_botkit.configureSlackApp = function(slack_app_config, cb) {

        slack_botkit.log('** Configuring app as a Slack App!');
        if (!slack_app_config || !slack_app_config.clientId ||
            !slack_app_config.clientSecret || !slack_app_config.scopes) {
            throw new Error('Missing oauth config details');
        } else {
            slack_botkit.config.clientId = slack_app_config.clientId;
            slack_botkit.config.clientSecret = slack_app_config.clientSecret;
            if (slack_app_config.redirectUri) slack_botkit.config.redirectUri = slack_app_config.redirectUri;
            if (typeof(slack_app_config.scopes) == 'string') {
                slack_botkit.config.scopes = slack_app_config.scopes.split(/\,/);
            } else {
                slack_botkit.config.scopes = slack_app_config.scopes;
            }
            if (cb) cb(null);
        }

        return slack_botkit;

    };

    // set up a web route that is a landing page
    slack_botkit.createHomepageEndpoint = function(webserver) {

        slack_botkit.log('** Serving app landing page at : http://' +
            slack_botkit.config.hostname + ':' + slack_botkit.config.port + '/');

        // FIX THIS!!!
        // this is obvs not right.
        webserver.get('/', function(req, res) {

            res.send('Howdy!');

        });

        return slack_botkit;

    };


    // adds the webhook authentication middleware module to the webserver
    function secureWebhookEndpoints() {
        var authenticationMiddleware = require(__dirname + '/middleware/slack_authentication.js');
        // convert a variable argument list to an array, drop the webserver argument
        var tokens = Array.prototype.slice.call(arguments);
        var webserver = tokens.shift();

        slack_botkit.log(
            '** Requiring token authentication for webhook endpoints for Slash commands ' +
            'and outgoing webhooks; configured ' + tokens.length + ' token(s)'
        );

        webserver.use(authenticationMiddleware(tokens));
    }

    // set up a web route for receiving outgoing webhooks and/or slash commands
    slack_botkit.createWebhookEndpoints = function(webserver, authenticationTokens) {

        if (authenticationTokens !== undefined && arguments.length > 1 && arguments[1].length) {
            secureWebhookEndpoints.apply(null, arguments);
        }

        slack_botkit.log(
            '** Serving webhook endpoints for Slash commands and outgoing ' +
            'webhooks at: http://' + slack_botkit.config.hostname + ':' + slack_botkit.config.port + '/slack/receive');
        webserver.post('/slack/receive', function(req, res) {

            // respond to Slack that the webhook has been received.
            res.status(200);

            // Now, pass the webhook into be processed
            slack_botkit.handleWebhookPayload(req, res);

        });

        return slack_botkit;
    };

    slack_botkit.findAppropriateTeam = function(payload, cb) {

        var found_team = null;

        var team_id = payload.team_id || (payload.team && payload.team.id) || null;
        slack_botkit.findTeamById(team_id, function(err, team) {
            if (team) {
                cb(err, team);
            } else {
                if (payload.authed_teams) {
                    async.eachSeries(payload.authed_teams, function(team_id, next) {
                        slack_botkit.findTeamById(team_id, function(err, team) {
                            if (team) {
                                found_team = team;
                                next();
                            } else {
                                next(err);
                            }
                        });
                    }, function(err) {
                        if (!found_team) {
                            cb(err);
                        } else {
                            cb(null, found_team);
                        }
                    });
                } else {
                    cb(new Error(`could not find team ${team_id}`));
                }
            }
        });
    };

    slack_botkit.handleWebhookPayload = function(req, res) {

        // is this an events api url handshake?
        if (req.body.type === 'url_verification') {
            slack_botkit.debug('Received url handshake');
            res.json({ challenge: req.body.challenge });
            return;
        }

        var payload = req.body;
        if (payload.payload) {
            payload = JSON.parse(payload.payload);
        }

        slack_botkit.findAppropriateTeam(payload, function(err, team) {
            if (err) {
                slack_botkit.log.error('Could not load team while processing webhook: ', err);
                return;
            } else if (!team) {
                // if this is NOT a slack app, it is ok to spawn a generic bot
                // this is only likely to happen with custom slash commands
                if (!slack_botkit.config.clientId) {
                    bot = slack_botkit.spawn({});
                } else {
                    return;
                }
            } else {
                // spawn a bot
                bot = slack_botkit.spawn(team);

                // Identify the bot from either team storage or identifyBot()
                bot.team_info = team;

                // The bot identity is only used in handleEventsAPI during this flow
                // Recent changes in Slack will break other integrations as they no longer
                // require a bot and therefore Slack won't send the bot information.
                if (payload.type === 'event_callback') {

                    if (!team.bot) {
                        slack_botkit.log.error('No bot identity found.');
                        return;
                    }

                    bot.identity = {
                        id: team.bot.user_id,
                        name: team.bot.name
                    };
                }
            }

            // include the response channel so that they can be used in
            // responding to slash commands and outgoing webhooks
            bot.res = res;

            // pass the payload into Botkit's message handling pipeline!
            slack_botkit.ingest(bot, payload, res);

        });
    };



    // Send a 200 response back to Slack to acknowledge the message.
    slack_botkit.middleware.ingest.use(function sendResponse(bot, message, res, next) {

        if (res && res.statusCode) {
            // this is an http response
            // always send a 200
            res.status(200);

            // conditionally send a response back to Slack to acknowledge the message.
            // we do NOT want to respond to incoming webhooks or slash commands
            // as the response can be used by developers to actually deliver a reply
            if (!message.command && !message.trigger_word) {
                res.send('');
            }
        }
        next();

    });

    /* do delivery confirmations for RTM messages */
    slack_botkit.middleware.ingest.use(function requireDelivery(bot, message, res, next) {
        if (message.ok != undefined) {
            // this is a confirmation of something we sent.
            if (slack_botkit.config.require_delivery) {
                // loop through all active conversations this bot is having
                // and mark messages in conversations as delivered = true
                for (var t = 0; t < slack_botkit.tasks.length; t++) {
                    var task = slack_botkit.tasks[t];
                    if (task.isActive()) {
                        for (var c = 0; c < task.convos.length; c++) {
                            var convo = task.convos[c];
                            for (var s = 0; s < convo.sent.length; s++) {
                                var sent = convo.sent[s];
                                if (sent.api_response && sent.api_response.id == message.reply_to) {
                                    sent.delivered = true;
                                    sent.api_response.ts = message.ts;
                                }
                            }
                        }
                    }
                }
            }
            return false;
        }

        next();
    });



    slack_botkit.middleware.categorize.use(function(bot, message, next) {

        var mentionSyntax = '<@' + bot.identity.id + '(\\|' + bot.identity.name.replace('.', '\\.') + ')?>';
        var mention = new RegExp(mentionSyntax, 'i');
        var direct_mention = new RegExp('^' + mentionSyntax, 'i');

        if ('message' == message.type) {

            if (message.text) {
                message.text = message.text.trim();
            }

            // set up a couple of special cases based on subtype
            if (message.subtype && message.subtype == 'channel_join') {
                // someone joined. maybe do something?
                if (message.user == bot.identity.id) {
                    message.type = 'bot_channel_join';
                } else {
                    message.type = 'user_channel_join';
                }
            } else if (message.subtype && message.subtype == 'group_join') {
                // someone joined. maybe do something?
                if (message.user == bot.identity.id) {
                    message.type = 'bot_group_join';
                } else {
                    message.type = 'user_group_join';
                }
            } else if (message.subtype) {
                message.type = message.subtype;
            } else if (message.channel.match(/^D/)) {
                // this is a direct message
                message.type = 'direct_message';

                if (message.user == bot.identity.id && message.bot_id) {
                    message.type = 'self_message';
                }
                if (!message.text) {
                    // message without text is probably an edit
                    return false;
                }

                // remove direct mention so the handler doesn't have to deal with it
                message.text = message.text.replace(direct_mention, '')
                .replace(/^\s+/, '').replace(/^\:\s+/, '').replace(/^\s+/, '');


            } else {
                if (!message.text) {
                    // message without text is probably an edit
                    return false;
                }

                if (message.text.match(direct_mention)) {
                    // this is a direct mention
                    message.text = message.text.replace(direct_mention, '')
                    .replace(/^\s+/, '').replace(/^\:\s+/, '').replace(/^\s+/, '');
                    message.type = 'direct_mention';

                } else if (message.text.match(mention)) {
                    message.type = 'mention';
                } else {
                    message.type = 'ambient';
                }

                if (message.user == bot.identity.id && message.bot_id) {
                    message.type = 'self_message';
                }


            }
        }

        // move on to the next stage of the pipeline
        next();

    });


    /* Handler functions for the various ways Slack might send a message to
     * Botkit via webhooks.  These include interactive messages (button clicks),
     * events api (messages sent over web hook), slash commands, and outgoing webhooks
     * (patterns matched in slack that result in a webhook)
     */
    slack_botkit.middleware.normalize.use(function handleInteractiveMessage(bot, message, next) {

        if (message.callback_id) {

            // let's normalize some of these fields to match the rtm message format
            message.user = message.user.id;
            message.channel = message.channel.id;

            // put the action value in the text field
            // this allows button clicks to respond to asks
            message.text = message.actions[0].value;

            // handle menus too!
            // take the first selected item
            // TODO: When Slack supports multi-select menus, this will need an update!
            if (message.actions[0].selected_options) {
                message.text = message.actions[0].selected_options[0].value;
            }

            message.type = 'interactive_message_callback';

        }


        next();

    });

    slack_botkit.middleware.normalize.use(function handleEventsAPI(bot, message, next) {

        if (message.type == 'event_callback') {

            // var message = {};
            for (var key in message.event) {
                message[key] = message.event[key];
            }

            // let's normalize some of these fields to match the rtm message format
            message.team = message.team_id;
            message.events_api = true;
            message.authed_users = message.authed_users;

            if (bot.identity == undefined || bot.identity.id == null) {
                console.error('Could not identify bot');
                return;
            } else if (bot.identity.id === message.user && message.subtype !== 'channel_join' && message.subtype !== 'group_join') {
                console.error('Got event from this bot user, ignoring it');
                return;
            }

        }
        next();
    });

    slack_botkit.middleware.normalize.use(function handleSlashCommand(bot, message, next) {


        if (message.command) {

            message.user = message.user_id;
            message.channel = message.channel_id;

            message.type = 'slash_command';
        }

        next();

    });

    slack_botkit.middleware.normalize.use(function handleOutgoingWebhook(bot, message, next) {

        if (message.trigger_word) {

            message.user = message.user_id;
            message.channel = message.channel_id;

            message.type = 'outgoing_webhook';
        }

        next();
    });



    slack_botkit.middleware.format.use(function formatForSlack(bot, message, platform_message, next) {

        platform_message.type = message.type || 'message';
        platform_message.channel =  message.channel;
        platform_message.text =  message.text || null;
        platform_message.username =  message.username || null;
        platform_message.thread_ts =  message.thread_ts || null;
        platform_message.reply_broadcast =  message.reply_broadcast || null;
        platform_message.parse =  message.parse || null;
        platform_message.link_names =  message.link_names || null;
        platform_message.attachments =  message.attachments ?
            JSON.stringify(message.attachments) : null;
        platform_message.unfurl_links =  typeof message.unfurl_links !== 'undefined' ? message.unfurl_links : null;
        platform_message.unfurl_media =  typeof message.unfurl_media !== 'undefined' ? message.unfurl_media : null;
        platform_message.icon_url =  message.icon_url || null;
        platform_message.icon_emoji =  message.icon_emoji || null;


        if (platform_message.icon_url || platform_message.icon_emoji || platform_message.username) {
            platform_message.as_user = false;
        } else {
            platform_message.as_user = platform_message.as_user || true;
        }

        next();

    });




    /* End of webhook handler functions
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

    slack_botkit.saveTeam = function(team, cb) {
        slack_botkit.storage.teams.save(team, cb);
    };

    // look up a team's memory and configuration and return it, or
    // return an error!
    slack_botkit.findTeamById = function(id, cb) {
        slack_botkit.storage.teams.get(id, cb);
    };

    // get a team url to redirect the user through oauth process
    slack_botkit.getAuthorizeURL = function(team_id, redirect_params) {

        var scopes = slack_botkit.config.scopes;
        var api_root = slack_botkit.config.api_root ? slack_botkit.config.api_root : 'https://slack.com';

        var url = api_root + '/oauth/authorize' + '?client_id=' +
            slack_botkit.config.clientId + '&scope=' + scopes.join(',') + '&state=botkit';

        if (team_id)
            url += '&team=' + team_id;

        if (slack_botkit.config.redirectUri) {
            var redirect_query = '';
            var redirect_uri = slack_botkit.config.redirectUri;
            if (redirect_params) {
                redirect_query += encodeURIComponent(querystring.stringify(redirect_params));
                redirect_uri = redirect_uri + '?' + redirect_query;
            }
            url += '&redirect_uri=' + redirect_uri;
        }

        return url;

    };

    // set up a web route for redirecting users
    // and collecting authentication details
    // https://api.slack.com/docs/oauth
    // https://api.slack.com/docs/oauth-scopes
    slack_botkit.createOauthEndpoints = function(webserver, callback) {

        slack_botkit.log('** Serving login URL: http://' +
            slack_botkit.config.hostname + ':' + slack_botkit.config.port + '/login');

        if (!slack_botkit.config.clientId) {
            throw new Error(
                'Cannot create oauth endpoints without calling configureSlackApp() with a clientId first');
        }
        if (!slack_botkit.config.clientSecret) {
            throw new Error(
                'Cannot create oauth endpoints without calling configureSlackApp() with a clientSecret first');
        }
        if (!slack_botkit.config.scopes) {
            throw new Error(
                'Cannot create oauth endpoints without calling configureSlackApp() with a list of scopes first');
        }

        var call_api = function(command, options, cb) {

            var api_root = slack_botkit.config.api_root ? slack_botkit.config.api_root : 'https://slack.com';


            slack_botkit.log('** API CALL: ' + api_root + '/api/' + command);
            request.post(api_root + '/api/' + command, function(error, response, body) {
                slack_botkit.debug('Got response', error, body);
                if (!error && response.statusCode == 200) {
                    var json = JSON.parse(body);
                    if (json.ok) {
                        if (cb) cb(null, json);
                    } else {
                        if (cb) cb(json.error, json);
                    }
                } else {
                    if (cb) cb(error);
                }
            }).form(options);
        };

        var oauth_access = function(options, cb) {
            call_api('oauth.access', options, cb);
        };

        var auth_test = function(options, cb) {
            call_api('auth.test', options, cb);
        };

        webserver.get('/login', function(req, res) {
            res.redirect(slack_botkit.getAuthorizeURL());
        });

        slack_botkit.log('** Serving oauth return endpoint: http://' +
            slack_botkit.config.hostname + ':' + slack_botkit.config.port + '/oauth');

        webserver.get('/oauth', function(req, res) {

            var code = req.query.code;
            var state = req.query.state;

            var opts = {
                client_id: slack_botkit.config.clientId,
                client_secret: slack_botkit.config.clientSecret,
                code: code
            };

            var redirect_params = {};
            if (slack_botkit.config.redirectUri) {
                Object.assign(redirect_params, req.query);
                delete redirect_params.code;
                delete redirect_params.state;

                var redirect_query = querystring.stringify(redirect_params);
                var redirect_uri = slack_botkit.config.redirectUri;
                if (redirect_query) {
                    redirect_uri = redirect_uri + '?' + redirect_query;
                }
                opts.redirect_uri = redirect_uri;
            }

            oauth_access(opts, function(err, auth) {

                if (err) {
                    if (callback) {
                        callback(err, req, res);
                    } else {
                        res.status(500).send(err);
                    }
                    slack_botkit.trigger('oauth_error', [err]);
                } else {

                    // auth contains at least:
                    // { access_token, scope, team_name}
                    // May also contain:
                    // { team_id } (not in incoming_webhook scope)
                    // info about incoming webhooks:
                    // { incoming_webhook: { url, channel, configuration_url} }
                    // might also include slash commands:
                    // { commands: ??}

                    // what scopes did we get approved for?
                    var scopes = auth.scope.split(/\,/);

                    // temporarily use the token we got from the oauth
                    // we need to call auth.test to make sure the token is valid
                    // but also so that we reliably have the team_id field!
                    //slack_botkit.config.token = auth.access_token;
                    auth_test({token: auth.access_token}, function(err, identity) {

                        if (err) {
                            if (callback) {
                                callback(err, req, res);
                            } else {
                                res.status(500).send(err);
                            }

                            slack_botkit.trigger('oauth_error', [err]);

                        } else {
                            req.identity = identity;

                            // we need to deal with any team-level provisioning info
                            // like incoming webhooks and bot users
                            // and also with the personal access token from the user

                            slack_botkit.findTeamById(identity.team_id, function(err, team) {

                                var isnew = false;
                                if (!team) {
                                    isnew = true;
                                    team = {
                                        id: identity.team_id,
                                        createdBy: identity.user_id,
                                        url: identity.url,
                                        name: identity.team,
                                    };
                                }

                                team.state = state;

                                var bot = slack_botkit.spawn(team);

                                if (auth.incoming_webhook) {
                                    auth.incoming_webhook.token = auth.access_token;
                                    auth.incoming_webhook.createdBy = identity.user_id;
                                    team.incoming_webhook = auth.incoming_webhook;
                                    bot.configureIncomingWebhook(team.incoming_webhook);
                                    slack_botkit.trigger('create_incoming_webhook', [bot, team.incoming_webhook]);
                                }

                                if (auth.bot) {

                                    team.bot = {
                                        token: auth.bot.bot_access_token,
                                        user_id: auth.bot.bot_user_id,
                                        createdBy: identity.user_id,
                                        app_token: auth.access_token,
                                    };
                                    bot.configureRTM(team.bot);
                                    slack_botkit.trigger('create_bot', [bot, team.bot]);
                                }

                                slack_botkit.saveTeam(team, function(err, id) {
                                    if (err) {
                                        slack_botkit.log.error('An error occurred while saving a team: ', err);
                                        if (callback) {
                                            callback(err, req, res);
                                        } else {
                                            res.status(500).send(err);
                                        }
                                        slack_botkit.trigger('error', [err]);
                                    } else {
                                        if (isnew) {
                                            slack_botkit.trigger('create_team', [bot, team]);
                                        } else {
                                            slack_botkit.trigger('update_team', [bot, team]);
                                        }

                                        if (team.bot) {
                                            // call auth test on the bot token
                                            // to capture its name
                                            auth_test({
                                                token: team.bot.token
                                            }, function(err, auth_data) {
                                                team.bot.name = auth_data.user;
                                                slack_botkit.saveTeam(team, function(err, id) {
                                                    if (err) {
                                                        slack_botkit.log.error('An error occurred while saving a team: ', err);
                                                    }
                                                });

                                            });
                                        }

                                        slack_botkit.storage.users.get(identity.user_id, function(err, user) {
                                            isnew = false;
                                            if (!user) {
                                                isnew = true;
                                                user = {
                                                    id: identity.user_id,
                                                    team_id: identity.team_id,
                                                    user: identity.user,
                                                };
                                            }

                                            // Always update these because the token could become invalid
                                            // and scopes could change.
                                            user.access_token = auth.access_token;
                                            user.scopes = scopes;

                                            slack_botkit.storage.users.save(user, function(err, id) {

                                                if (err) {
                                                    slack_botkit.log.error(
                                                        'An error occurred while saving a user: ', err);
                                                    if (callback) {
                                                        callback(err, req, res);
                                                    } else {
                                                        res.status(500).send(err);
                                                    }
                                                    slack_botkit.trigger('error', [err]);
                                                } else {
                                                    if (isnew) {
                                                        slack_botkit.trigger(
                                                            'create_user',
                                                            [bot, user, redirect_params]
                                                        );
                                                    } else {
                                                        slack_botkit.trigger(
                                                            'update_user',
                                                            [bot, user, redirect_params]
                                                        );
                                                    }
                                                    if (callback) {
                                                        callback(null, req, res);
                                                    } else {
                                                        res.redirect('/');
                                                    }
                                                }
                                            });
                                        });
                                    }
                                });
                            });
                        }
                    });
                }
            });
        });

        return slack_botkit;

    };


    return slack_botkit;
};

module.exports = Slackbot;
