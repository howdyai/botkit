/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack Button application that adds a bot to one or many slack teams.

# RUN THE APP:
  Create a Slack app. Make sure to configure the bot user!
    -> https://api.slack.com/applications/new
    -> Add the Redirect URI: http://localhost:3000/oauth
  Run your bot from the command line:
    clientId=<my client id> clientSecret=<my client secret> port=3000 node slackbutton_bot.js
# USE THE APP
  Add the app to your Slack by visiting the login page:
    -> http://localhost:3000/login
  After you've added the app, try talking to your bot!
# EXTEND THE APP:
  Botkit has many features for building cool and useful bots!
  Read all about it here:
    -> http://howdy.ai/botkit
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/* Uses the slack button feature to offer a real time bot to multiple teams */
var Botkit = require('../../lib/Botkit.js');

if (!process.env.clientId || !process.env.clientSecret || !process.env.port) {
  console.log('Error: Specify clientId clientSecret and port in environment');
  process.exit(1);
}


var controller = Botkit.slackbot({
  studio_token: process.env.studio_token,
  json_file_store: './db_slackbutton_bot/',
  rtm_receive_messages: false, // disable rtm_receive_messages if you enable events api
}).configureSlackApp(
  {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    redirectUri: process.env.redirectUri, // optional parameter passed to slackbutton oauth flow
    scopes: ['bot'],
  }
);

controller.setupWebserver(process.env.port,function(err,webserver) {
  controller.createWebhookEndpoints(controller.webserver);

  controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});


// just a simple way to make sure we don't
// connect to the RTM twice for the same team
var _bots = {};
function trackBot(bot) {
  _bots[bot.config.token] = bot;
}


controller.startTicking();



controller.on('direct_message,direct_mention,mention', function(bot, message) {
  console.log('GOT MSG');
     controller.studio.runTrigger(bot, message.text, message.user, message.channel).then(function(convo) {
       console.log('got a convo');
     }).catch(function(err) {
        throw new Error(err);
     });
     return false;
});

controller.studio.before('zample', function(convo, next) {

  console.log('BEFORE ZAMPLE');
  next();

})

controller.studio.beforeThread('zample','foo', function(convo, next) {

  console.log('FIRING PLUGIN');
  console.log('changing from ', convo.thread,' to ', convo.next_thread);
  convo.gotoThread('bar');
  next();

});


controller.studio.beforeThread('zample','foo', function(convo, next) {

  console.log('FIRING PLUGIN 2');
  console.log('changing from ', convo.thread,' to ', convo.next_thread);

  next();

});

controller.studio.beforeThread('zample','bar', function(convo, next) {

  console.log('BEFORE BAR');
  console.log('changing from ', convo.thread,' to ', convo.next_thread);

  next();
});




controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {

  bot.startConversation(message, function(err, convo) {

    convo.addMessage({text: 'hello', action:'foo'},'default');

    convo.addMessage({text: 'foo'},'foo');

    convo.beforeThread('foo', function(convo, next) {

      console.log('BEFORE FOO!');
      next();

    });

    convo.beforeThread('foo', function(convo, next) {

      console.log('ALSO BEFORE FOO');
      next();

    });


    console.log('GO BAB GO');

  });


});




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
  // you may want to attempt to re-open
});

controller.hears('hello','direct_message',function(bot,message) {
  bot.reply(message,'Hello!');
});

controller.hears('^stop','direct_message',function(bot,message) {
  bot.reply(message,'Goodbye');
  bot.rtm.close();
});

controller.on(['direct_message','mention','direct_mention'],function(bot,message) {
  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'robot_face',
  },function(err) {
    if (err) { console.log(err) }
    bot.reply(message,'I heard you loud and clear boss.');
  });
});
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
//       controller.spawn(teams[t]).startRTM(function(err, bot) {
//         if (err) {
//           console.log('Error connecting bot to Slack:',err);
//         } else {
//           trackBot(bot);
//         }
//       });
//     }
//   }
//
// });
