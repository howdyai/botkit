var Botkit = require('./lib/Botkit.js');
var os = require('os');
var config = require('getconfig');
var Soapbox = require('./lib/soapbox/Soapbox.js');

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

// Create secure web server and listen for when a team adds the app
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

// Listen for when Simone is created
controller.on('create_bot',function(bot,config) {

  if (_bots[bot.config.token]) {
    // already online! do nothing.
  } else {
    bot.startRTM(function(err) {

      if (!err) {
        trackBot(bot);
      }

      bot.startPrivateConversation({user: config.createdBy},function(err,convo) {
        if (err) {
          console.log(err);
        } else {
          convo.say('I am a bot that has just joined your team');
          convo.say('You must now /invite me to a channel so that I can be of use!');
        }
      });

    });
  }

});

// Handle events related to the websocket connection to Slack
controller.on('rtm_open',function(bot) {
  console.log('** The RTM api just connected!');
});

controller.on('rtm_close',function(bot) {
  console.log('** The RTM api just closed');

  bot.startRTM(function(err) {
    if (err) {
      console.log('***FAILED TO RESTART RTM');
      process.exit(1);
    }
  })
});

// Load all the teams and set up the bots for them
// right now it's local storage probably DB in the future?
controller.storage.teams.all(function(err,teams) {

  if (err) {
    throw new Error(err);
  }

  // connect all teams with bots up to slack!
  for (var t  in teams) {
    if (teams[t].bot) {
      controller.spawn(teams[t]).startRTM(function(err, bot) {
        if (err) {
          console.log('Error connecting bot to Slack:',err);
        } else {
          trackBot(bot);
        }
      });
    }
  }
});

var soapbox = new Soapbox(controller);
soapbox.listen();
