require('dotenv').config();

var Botkit = require('../lib/Botkit.js');
var Reminder;
var Survey;

if (!process.env.TOKEN) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

var controller = Botkit.slackbot({
 debug: false
});

var init = function(bot) {
  Reminder = require('./reminder.js')(bot);
  Survey = require('./survey.js')(bot);
}

var bot = controller.spawn({
  token: process.env.TOKEN
}).startRTM(function(err) {
  if (err) {
    throw new Error(err);
  }
  init(bot);
});

setInterval(function(){
    Reminder.getOutgoing();
}, 30000);

function sendReminders() {
  
}
