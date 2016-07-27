require('dotenv').config();

var Botkit = require('../lib/Botkit.js');
var Promise = require('bluebird');
var _ = require('underscore');

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
    // Reminder.get() returns a promise
    Reminder.get()
      .then(function(reminders){
        console.log(reminders);
        sendOut(reminders);
      });
    // console.log('reminders:');
    // console.log(reminders);
    // if(reminders)
    //   sendOut(reminders);
}, 80810);


function sendReminder(reminder){

}

// Message Slack User (Reminder || Surveys)
function sendOut(tasks) {
  _.each(tasks, function(task) {
    bot.startPrivateConversation({user: task.user}, function(response, convo) {
      convo.ask(task.message, function(response, convo) {
        convo.next();
      }, {key: "response"});
      convo.on('end', function(convo) {
          if(convo.status == 'completed') {
            var response = convo.extractResponse('response');
            Reminder.sendBackResponse(response, task.id);
          }
      });

    });
  });
}
