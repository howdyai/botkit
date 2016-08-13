var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

function Slackbot(configuration) {

    // Create a core botkit bot
    var slack_botkit = Botkit(configuration || {});

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
        } else {
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

        slack_botkit.log('** Serving app landing page at : http://MY_HOST:' + slack_botkit.config.port + '/');

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
            'webhooks at: http://MY_HOST:' + slack_botkit.config.port + '/slack/receive');
        webserver.post('/slack/receive', function(req, res) {

            // is this an interactive message callback?
            if (req.body.payload) {

                var message = JSON.parse(req.body.payload);
                for (var key in req.body) {
                    message[key] = req.body[key];
                }

                // let's normalize some of these fields to match the rtm message format
                message.user = message.user.id;
                message.channel = message.channel.id;

                // put the action value in the text field
                // this allows button clicks to respond to asks
                message.text = message.actions[0].value;

                message.type = 'interactive_message_callback';

                slack_botkit.findTeamById(message.team.id, function(err, team) {
                    if (err || !team) {
                        slack_botkit.log.error('Received interactive message, but could not load team');
                    } else {
                        res.status(200);
                        res.send('');

                        var bot = slack_botkit.spawn(team);

                        bot.team_info = team;
                        bot.res = res;

                        slack_botkit.trigger('interactive_message_callback', [bot, message]);

                        if (configuration.interactive_replies) {
                            message.type = 'message';
                            slack_botkit.receiveMessage(bot, message);
                        }
                    }
                });

            // this is a slash command
            } else if (req.body.command) {
                var message = {};

                for (var key in req.body) {
                    message[key] = req.body[key];
                }

                // let's normalize some of these fields to match the rtm message format
                message.user = message.user_id;
                message.channel = message.channel_id;

                // Is this configured to use Slackbutton?
                // If so, validate this team before triggering the event!
                // Otherwise, it's ok to just pass a generic bot in
                if (slack_botkit.config.clientId && slack_botkit.config.clientSecret) {

                    slack_botkit.findTeamById(message.team_id, function(err, team) {
                        if (err || !team) {
                            slack_botkit.log.error('Received slash command, but could not load team');
                        } else {
                            message.type = 'slash_command';
                            // HEY THERE
                            // Slash commands can actually just send back a response
                            // and have it displayed privately. That means
                            // the callback needs access to the res object
                            // to send an optional response.

                            res.status(200);

                            var bot = slack_botkit.spawn(team);

                            bot.team_info = team;
                            bot.res = res;

                            slack_botkit.receiveMessage(bot, message);

                        }
                    });
                } else {

                    message.type = 'slash_command';
                    // HEY THERE
                    // Slash commands can actually just send back a response
                    // and have it displayed privately. That means
                    // the callback needs access to the res object
                    // to send an optional response.

                    var team = {
                        id: message.team_id,
                    };

                    res.status(200);

                    var bot = slack_botkit.spawn({});

                    bot.team_info = team;
                    bot.res = res;

                    slack_botkit.receiveMessage(bot, message);

                }

            } else if (req.body.trigger_word) {

                var message = {};

                for (var key in req.body) {
                    message[key] = req.body[key];
                }


                var team = {
                    id: message.team_id,
                };

                // let's normalize some of these fields to match the rtm message format
                message.user = message.user_id;
                message.channel = message.channel_id;

                message.type = 'outgoing_webhook';

                res.status(200);

                var bot = slack_botkit.spawn(team);
                bot.res = res;
                bot.team_info = team;


                slack_botkit.receiveMessage(bot, message);

                // outgoing webhooks are also different. They can simply return
                // a response instead of using the API to reply.  Maybe this is
                // a different type of event!!

            }

        });

        return slack_botkit;
    };

    slack_botkit.saveTeam = function(team, cb) {
        slack_botkit.storage.teams.save(team, cb);
    };

    // look up a team's memory and configuration and return it, or
    // return an error!
    slack_botkit.findTeamById = function(id, cb) {
        slack_botkit.storage.teams.get(id, cb);
    };

    slack_botkit.setupWebserver = function(port, cb) {

        if (!port) {
            throw new Error('Cannot start webserver without a port');
        }
        if (isNaN(port)) {
            throw new Error('Specified port is not a valid number');
        }

        var static_dir =  __dirname + '/public';

        if (slack_botkit.config && slack_botkit.config.webserver && slack_botkit.config.webserver.static_dir)
            static_dir = slack_botkit.config.webserver.static_dir;

        slack_botkit.config.port = port;

        slack_botkit.webserver = express();
        slack_botkit.webserver.use(bodyParser.json());
        slack_botkit.webserver.use(bodyParser.urlencoded({ extended: true }));
        slack_botkit.webserver.use(express.static(static_dir));

        var server = slack_botkit.webserver.listen(
            slack_botkit.config.port,
            function() {
                slack_botkit.log('** Starting webserver on port ' +
                    slack_botkit.config.port);
                if (cb) { cb(null, slack_botkit.webserver); }
            });

        return slack_botkit;

    };

    // get a team url to redirect the user through oauth process
    slack_botkit.getAuthorizeURL = function(team_id) {

        var scopes = slack_botkit.config.scopes;
        var url = 'https://slack.com/oauth/authorize' + '?client_id=' +
            slack_botkit.config.clientId + '&scope=' + scopes.join(',') + '&state=botkit';

        if (team_id)
            url += '&team=' + team_id;

        if (slack_botkit.config.redirectUri)
            url += '&redirect_uri=' + slack_botkit.config.redirectUri;

        return url;

    };

    // set up a web route for redirecting users
    // and collecting authentication details
    // https://api.slack.com/docs/oauth
    // https://api.slack.com/docs/oauth-scopes
    slack_botkit.createOauthEndpoints = function(webserver, callback) {

        slack_botkit.log('** Serving login URL: http://MY_HOST:' + slack_botkit.config.port + '/login');

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
            slack_botkit.log('** API CALL: ' + 'https://slack.com/api/' + command);
            request.post('https://slack.com/api/' + command, function(error, response, body) {
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

        slack_botkit.log('** Serving oauth return endpoint: http://MY_HOST:' + slack_botkit.config.port + '/oauth');

        webserver.get('/oauth', function(req, res) {

            var code = req.query.code;
            var state = req.query.state;

            var opts = {
                client_id: slack_botkit.config.clientId,
                client_secret: slack_botkit.config.clientSecret,
                code: code
            };

            if (slack_botkit.config.redirectUri) opts.redirect_uri = slack_botkit.config.redirectUri;

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
                                                        slack_botkit.trigger('create_user', [bot, user]);
                                                    } else {
                                                        slack_botkit.trigger('update_user', [bot, user]);
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

    slack_botkit.handleSlackEvents = function() {

        slack_botkit.log('** Setting up custom handlers for processing Slack messages');
        slack_botkit.on('message_received', function(bot, message) {
            var mentionSyntax = '<@' + bot.identity.id + '(\\|' + bot.identity.name.replace('.', '\\.') + ')?>';
            var mention = new RegExp(mentionSyntax, 'i');
            var direct_mention = new RegExp('^' + mentionSyntax, 'i');

            if (message.ok != undefined) {
                // this is a confirmation of something we sent.
                return false;
            }

            slack_botkit.debug('DEFAULT SLACK MSG RECEIVED RESPONDER');
            if ('message' == message.type) {

                if (message.text) {
                    message.text = message.text.trim();
                }

                // set up a couple of special cases based on subtype
                if (message.subtype && message.subtype == 'channel_join') {
                    // someone joined. maybe do something?
                    if (message.user == bot.identity.id) {
                        slack_botkit.trigger('bot_channel_join', [bot, message]);
                        return false;
                    } else {
                        slack_botkit.trigger('user_channel_join', [bot, message]);
                        return false;
                    }
                } else if (message.subtype && message.subtype == 'group_join') {
                    // someone joined. maybe do something?
                    if (message.user == bot.identity.id) {
                        slack_botkit.trigger('bot_group_join', [bot, message]);
                        return false;
                    } else {
                        slack_botkit.trigger('user_group_join', [bot, message]);
                        return false;
                    }
                } else if (message.subtype) {
                    slack_botkit.trigger(message.subtype, [bot, message]);
                    return false;
                } else if (message.channel.match(/^D/)) {
                    // this is a direct message
                    if (message.user == bot.identity.id) {
                        return false;
                    }
                    if (!message.text) {
                        // message without text is probably an edit
                        return false;
                    }

                    // remove direct mention so the handler doesn't have to deal with it
                    message.text = message.text.replace(direct_mention, '')
                    .replace(/^\s+/, '').replace(/^\:\s+/, '').replace(/^\s+/, '');

                    message.event = 'direct_message';

                    slack_botkit.trigger('direct_message', [bot, message]);
                    return false;

                } else {
                    if (message.user == bot.identity.id) {
                        return false;
                    }
                    if (!message.text) {
                        // message without text is probably an edit
                        return false;
                    }


                    if (message.text.match(direct_mention)) {
                        // this is a direct mention
                        message.text = message.text.replace(direct_mention, '')
                        .replace(/^\s+/, '').replace(/^\:\s+/, '').replace(/^\s+/, '');
                        message.event = 'direct_mention';

                        slack_botkit.trigger('direct_mention', [bot, message]);
                        return false;
                    } else if (message.text.match(mention)) {
                        message.event = 'mention';
                        slack_botkit.trigger('mention', [bot, message]);
                        return false;
                    } else {
                        message.event = 'ambient';
                        slack_botkit.trigger('ambient', [bot, message]);
                        return false;

                    }
                }
            } else {
                // this is a non-message object, so trigger a custom event based on the type
                slack_botkit.trigger(message.type, [bot, message]);
            }
        });
    };

    // set up the RTM message handlers once
    slack_botkit.handleSlackEvents();

    return slack_botkit;
};

module.exports = Slackbot;
