var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

function Facebookbot(configuration) {

    // Create a core botkit bot
    var facebook_botkit = Botkit(configuration || {});

    var facebook_worker = function(botkit, config) {
        var bot = {
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
            api: slackWebApi(botkit, config || {})
        };

        bot.say = function(message, cb) {
        }

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
                            cb(botkit.tasks[t].convos[c]);
                            return;
                        }
                    }
                }
            }

            cb();
        };

        return bot;
    };

    // customize the bot definition, which will be used when new connections
    // spawn!
    facebook_botkit.defineBot(facebook_worker);

    // set up configuration for oauth
    // facebook_app_config should contain
    // { clientId, clientSecret, scopes}
    // https://api.slack.com/docs/oauth-scopes
    facebook_botkit.configureFacebookApp = function(facebook_app_config, cb) {

        facebook_botkit.log('** Configuring app as a Facebook App!');
        if (!facebook_app_config || !facebook_app_config.clientId ||
            !facebook_app_config.clientSecret || !facebook_app_config.scopes) {
            throw new Error('Missing oauth config details', bot);
        } else {
            facebook_botkit.config.clientId = facebook_app_config.clientId;
            facebook_botkit.config.clientSecret = facebook_app_config.clientSecret;
            if (facebook_app_config.redirectUri) facebook_botkit.config.redirectUri = facebook_app_config.redirectUri;
            if (typeof(facebook_app_config.scopes) == 'string') {
                facebook_botkit.config.scopes = facebook_app_config.scopes.split(/\,/);
            } else {
                facebook_botkit.config.scopes = facebook_app_config.scopes;
            }
            if (cb) cb(null, bot);
        }

        return facebook_botkit;

    };

    // set up a web route for receiving outgoing webhooks and/or slash commands
    facebook_botkit.createWebhookEndpoints = function(webserver) {

        facebook_botkit.log(
            '** Serving webhook endpoints for Slash commands and outgoing ' +
            'webhooks at: http://MY_HOST:' + facebook_botkit.config.port + '/slack/receive');
        webserver.post('/facebook/receive', function(req, res) {

        });

        return facebook_botkit;
    };

    facebook_botkit.setupWebserver = function(port, cb) {

        if (!port) {
            throw new Error('Cannot start webserver without a port');
        }
        if (isNaN(port)) {
            throw new Error('Specified port is not a valid number');
        }

        facebook_botkit.config.port = port;

        facebook_botkit.webserver = express();
        facebook_botkit.webserver.use(bodyParser.json());
        facebook_botkit.webserver.use(bodyParser.urlencoded({ extended: true }));
        facebook_botkit.webserver.use(express.static(__dirname + '/public'));

        var server = facebook_botkit.webserver.listen(
            facebook_botkit.config.port,
            function() {
                facebook_botkit.log('** Starting webserver on port ' +
                    facebook_botkit.config.port);
                if (cb) { cb(null, facebook_botkit.webserver); }
            });

        return facebook_botkit;

    };

    return facebook_botkit;
};

module.exports = Slackbot;
