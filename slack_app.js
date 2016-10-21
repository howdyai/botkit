var Botkit = require('./lib/Botkit.js');
var os = require('os');
var config = require('getconfig');

var controller = Botkit.slackbot({
    debug: config.botkit_debug,
    interactive_replies: config.botkit_interactive_replies,
    json_file_store: config.botkit_json_file_store,
    redirectUri: config.slack_redirect_uri,
}).configureSlackApp({
  clientId: config.slack_client_id,
  clientSecret: config.slack_client_secret,
  scopes: config.slack_app_scopes
});

controller.setupSecureWebserver(config.port,function(err,webserver) {
    controller.createWebhookEndpoints(controller.webserver);

    controller.createOauthEndpoints(controller.webserver,function(error,request,response) {
        if(error) {
            console.log('ERROR: ' + error);
            response.status(500).send('ERROR: ' + error);
        } else {
            console.log('SUCCESS')
            response.send("You've successfully installed this Slack app. Close the window!");
        }
    });
});

// just a simple way to make sure we don't
// connect to the RTM twice for the same team
var _bots = {};
function trackBot(bot) {
  _bots[bot.config.token] = bot;
}
