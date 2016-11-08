var Botkit = require('../lib/Botkit.js');

if (!process.env.clientId || !process.env.clientSecret || !process.env.port) {
    console.log('Error: Specify clientId clientSecret and port in environment');
    process.exit(1);
}

var controller = Botkit.slackbot({
    // Setup a local JSON database to store teams that have added your bot
    json_file_store: './db_slack_events_api/',
    debug: true,
    eventsApi: true,
}).configureSlackApp({
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    // Request bot scope to get all the bot events you have signed up for
    scopes: ['bot'],
});

// Setup the webhook which will receive Slack Event API requests
controller.setupWebserver(process.env.port, function(err, webserver) {
    controller.createWebhookEndpoints(controller.webserver);

    controller.createOauthEndpoints(controller.webserver, function(err, req, res) {
        if (err) {
            res.status(500).send('ERROR: ' + err);
        } else {
            res.send('Success!');
        }
    });
});


// Watch for Events API reaction_added event
controller.on('reaction_added', function(bot, message) {
    // If reaction was added to a message, add another reaction to the same message
    if (message.item.type === 'message') {
        bot.api.reactions.add({
            timestamp: message.item.ts,
            channel: message.item.channel,
            name: 'robot_face'
        }, function(err) {
            if (err) {
                console.log(err);
            }
        });
    }

});

// When custom emoji is added, post to #general to try it out
controller.on('emoji_changed', function(bot, message) {
    if (message.subtype === 'add') {
        var targetChannel;
        bot.api.channels.list({}, function(err, list) {
            if (err) {
                console.log(err);
            }
            var name = 'general';
            var obj = list.channels.filter(function(obj) {
                return obj.name === name;
            })[0];
            targetChannel = obj.id;
            bot.say({
                text: 'Hey neat I like this one a lot!\n:' + message.name + ':',
                channel: targetChannel
            });
        });


    }

});

controller.hears('pizza', ['direct_mention', 'direct_message'], function(bot, message) {
    bot.reply(message, ':pizza:');
});

controller.hears('start', ['direct_message'], function(bot, message) {
        bot.startConversation(message, function(err, convo) {
            convo.ask('Would you like to continue?', [{
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Okay Great!');
                    convo.repeat();
                    convo.next();
                }
            }, {
                pattern: bot.utterances.no,
                callback: function(response, convo) {
                    convo.say('I understand');
                    convo.next();
                }
            }]);

        });
    }

);


var _bots = {};
function trackBot(bot) {
  _bots[bot.config.token] = bot;
}

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
