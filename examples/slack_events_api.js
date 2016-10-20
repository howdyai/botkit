var Botkit = require('../lib/Botkit.js');

if (!process.env.clientId || !process.env.clientSecret || !process.env.port) {
    console.log('Error: Specify clientId clientSecret and port in environment');
    process.exit(1);
}

var controller = Botkit.slackbot({
    // Setup a local JSON database to store teams that have added your bot
    json_file_store: './db_slack_events_api/',
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

// Start ticking to enable conversations
controller.startTicking()

// Watch for Events API reaction_added event
controller.on('reaction_added', function(bot, message) {
    // If reaction was added to a message
    // add the same reaction to the same message as your bot
    if (message.item.type === 'message') {
        bot.api.reactions.add({
            timestamp: message.item.ts,
            channel: message.item.channel,
            name: message.reaction
        }, function(err) {
            if (err) {
                console.log(err)
            }
        })
    }

})

controller.on('emoji_changed', function(bot, message) {
    console.log('============== OOOOOH LOOK AN EMOJI CHANGE!\n', message)
    if (message.subtype === 'add') {
      let targetChannel
      bot.api.channels.list({}, function(err, list) {
        if (err) {
          console.log(err)
        }
        var name = 'bot-sandbox'
        var obj = list.channels.filter(function(obj) {
          return obj.name === name
        })[0]
        targetChannel = obj.id
        console.log('===============CHANNEL', targetChannel)
        bot.say({
          text: 'Hey neat I like this one a lot!\n:' + message.name + ':',
        channel: targetChannel
      }
    )
      })


    }

})


controller.hears('pizza', ['direct_mention', 'direct_message'], function(bot, message) {
  bot.reply(message, ':pizza:')
})

controller.hears('start', ['direct_message'], function(bot, message) {
        bot.startConversation(message, function(err, convo) {
            convo.ask('Would you like to continue?', [{
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Okay Great!')
                    convo.repeat()
                    convo.next()
                }
            }, {
                pattern: bot.utterances.no,
                callback: function(response, convo) {
                    convo.say('I understand')
                    convo.next()
                }
            }])

        })
    }

)

// controller.on('create_bot',function(bot,config) {
//
//   if (_bots[bot.config.token]) {
//     // already online! do nothing.
//   } else {
//     bot.startRTM(function(err) {
//     // bot.identity =
//       if (!err) {
//         trackBot(bot);
//       }
//
//       bot.startPrivateConversation({user: config.createdBy},function(err,convo) {
//         if (err) {
//           console.log(err);
//         } else {
//           convo.say('I am a bot that has just joined your team');
//           convo.say('You must now /invite me to a channel so that I can be of use!');
//         }
//       });
//
//     });
//   }
//
// });

//
//
// controller.storage.teams.all(function(err,teams) {
//
//   if (err) {
//     throw new Error(err);
//   }
//
//   // connect all teams with bots up to slack!
//   for (var t  in teams) {
//     if (teams[t].bot) {
//       controller.spawn(teams[t])
//
//     }
//   }
//
// });
