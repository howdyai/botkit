/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    _______..___  ___.   ______     ______     ______  __    __  .______     ______   .___________.
    /       ||   \/   |  /  __  \   /  __  \   /      ||  |  |  | |   _  \   /  __  \  |           |
   |   (----`|  \  /  | |  |  |  | |  |  |  | |  ,----'|  |__|  | |  |_)  | |  |  |  | `---|  |----`
    \   \    |  |\/|  | |  |  |  | |  |  |  | |  |     |   __   | |   _  <  |  |  |  |     |  |     
.----)   |   |  |  |  | |  `--'  | |  `--'  | |  `----.|  |  |  | |  |_)  | |  `--'  |     |  |     
|_______/    |__|  |__|  \______/   \______/   \______||__|  |__| |______/   \______/      |__|     
                                                                                                    
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


var Botkit = require('../lib/Botkit.js')
var os = require('os');

//Initialization
var controller = Botkit.smoochbot({
    appToken:process.env.APPTOKEN,
    key:process.env.KEY,
    secret:process.env.SECRET,
    incoming_webhook:{url:process.env.INCOMING_WEBHOOK},
    bot_name:process.env.BOT_NAME,
    avatar_url:process.env.AVATAR_URL
});

var bot = controller.spawn()

bot.configureIncomingWebhook();
controller.startTicking();

controller.setupWebserver(process.env.PORT, function(err, server) {
  controller.createWebhookEndpoints(server);
});

//A greeting will start the conversation
controller.hears(['hello','hi','sup','yo','hey'],'message_received',function(bot,message) {
  bot.api.appUsers.get(message.user).then(function(response) {

    bot.reply(message,"Hello.");

    if (response && response.appUser && !response.appUser.email) {
      bot.startConversation(message, askEmail);
    } else {
      bot.startConversation(message, askArea);
    }
  });

})

//Handlers for various steps in the conversation
var askEmail = function(response, convo) {
  console.log(convo);

  convo.ask("Before we begin, can you please give me your e-mail address, this way someone from my team can get back to you if they're not around right now?", function(response, convo) {
      bot.api.appUsers.update(response.user, {"email": response.text}).then(function(response) {
        convo.say("Awesome, thanks!");
        askArea(response,convo);
        convo.next();
      });
  });
}

var askArea = function(response, convo) {
  convo.ask("Do you have a technical question?", [
    {
      pattern: bot.utterances.yes,
      callback: function(response, convo) {
        convo.say('Cool, one of my @engineers will be able to help you if I can\'t');
        askPlatform(response,convo);
        convo.next();
      }
    },
    {
      pattern: bot.utterances.no,
      default: true,
      callback: function(response, convo) {
        convo.say('*Phew!* I still haven\'t had any coffee and my circuits are a little rusty. One of my human friends from our @biz team will lend a hand in a few.');
        convo.next();
      }
    }
    ]);
}

var askPlatform = function(response, convo) {
  convo.ask("What platform are you working with, iOS, Android, Web, or API?", function(response, convo) {  
    convo.say("Thanks, I've alterted our @engineers - they'll be around in a jiffy.");
    convo.next();
  });
}

//Uptime stuff

controller.hears(['uptime','identify yourself','who are you','what is your name'],'message_received',function(bot,message) {

  var hostname = os.hostname();
  var uptime = formatUptime(process.uptime());

  bot.reply(message,'I am a bot named SmoochBot I have been running for ' + uptime + ' on ' + hostname + ".");

});


function formatUptime(uptime) {
  var unit = 'second';
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'minute';
  }
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'hour';
  }
  if (uptime != 1) {
    unit = unit +'s';
  }

  uptime = uptime + ' ' + unit;
  return uptime;
}