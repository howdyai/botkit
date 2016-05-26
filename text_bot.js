/*
Simple text bot to run from console. Simply run node text_bot.js and test the bot flow.
Ctrl-C to kill the bot
*/

var Botkit = require('./lib/Botkit.js');
var os = require('os');


var controller = Botkit.textbot({
    debug: false,
    log: false
});

var bot = controller.spawn({
});


controller.listenStdIn(bot);


controller.hears(['pizzatime'],['message_received'],function(bot,message) {
  bot.startConversation(message, askFlavor);
});

askFlavor = function(response, convo) {
  convo.ask("What flavor of pizza do you want?", function(response, convo) {
    convo.say("Awesome.");
    askSize(response, convo);
    convo.next();
  });
}

askSize = function(response, convo) {
  convo.ask("What size do you want?", function(response, convo) {
    convo.say("Ok.")
    askWhereDeliver(response, convo);
    convo.next();
  });
}

askWhereDeliver = function(response, convo) { 
  convo.ask("So where do you want it delivered?", function(response, convo) {
    convo.say("Ok! Goodbye.");
    convo.next();
  });
}
