/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
          \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
           \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/
This is a sample Slack bot built with Botkit.
This bot demonstrates a multi-stage conversation
# RUN THE BOT:
  Get a Bot token from Slack:
    -> http://my.slack.com/services/new/bot
  Run your bot from the command line:
    token=<MY TOKEN> node demo_bot.js
# USE THE BOT:
  Find your bot inside Slack
  Say: "pizzatime"
  The bot will reply "What flavor of pizza do you want?"
  Say what flavor you want.

  The bot will reply "Awesome" "What size do you want?"
  Say what size you want.
  The bot will reply "Ok." "So where do you want it delivered?"

  Say where you want it delivered.

  The bot will reply "Ok! Good by."

  ...and will refrain from billing your card because this is just a demo :P
# EXTEND THE BOT:
  Botkit is has many features for building cool and useful bots!
  Read all about it here:
    -> http://howdy.ai/botkit
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
var Botkit = require('../lib/Botkit.js');
var moment = require('moment');
var responses = [];
var index = 0;
var dndStatus = [];
var production = false;
var thom = 'U0M4AB3M0';
var newUser = [];

//set this flag to a process.env.debug flag prob
if (!process.env.token) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}
var controller = Botkit.slackbot({
    json_file_store: './db_slackbutton_incomingwebhook/',
 debug: false
});
controller.spawn({
  token: process.env.token
}).startRTM(function(err) {
  if (err) {
    throw new Error(err);
  }
});
controller.on("dnd_updated_user", function(bot, message){
    if(!production){console.log("dnd change");};

    console.log(message);
    if(message.user== thom ){
        console.log("success");
        dndStatus = message;



        //store dnd settings in a local variable

    }
    //now qualify the change

});
//GET IT SIMPLE FIRST
//create a conversation where we welcome a new user from a web api team_join event.
//first explain what fitpath is - for now just hey welcome to fitpath etc etc
//then step two ask some questions and then
//THREE and not before three - connect to a db or a json whatever is easiest and store the responses
// tip you can use convo.extractResponses() to dump this - or extractResponses(key) to pull a specfici one
// PRO TIP - AFTER that you can play with utterances and add some yes or no uestions and put some logic on it
//onbot functions
controller.on("channel_joined", function(bot,message){
    console.log("new team member deteced");
    console.log(message);

    if(message.user== thom ){
        console.log("success");
        newUser = message;


        //store dnd settings in a local variable
    }
});

controller.hears(['hello'],['direct_message', 'direct_mention', 'mention','ambient'], function(bot, message){
    console.log("heard something");
    if(dndStatus.user== thom && dndStatus.dnd_status.dnd_enabled) {
        bot.startConversation(message, dndResponse);
    }
});

dndResponse = function(response, convo) {
    convo.say("thom is out of the office right now");
    convo.say("He will be back " + parseTimeStamp(dndStatus.dnd_status.next_dnd_end_ts));
    convo.next();
}

controller.hears(['update'],['direct_message'],function(bot,message) {
  bot.startConversation(message, askOverall);

 });

askOverall = function(response, convo) {
     //get user name
 // convo.sayFirst("Hi," + " I'm Willow");
  convo.say("Thom built me to help keep track of how you are doing and store all that information for him");
  convo.say("I'm only three weeks old so I can't ");
  convo.ask("How is your week going?", function(response, convo) {



    askPositive(response, convo);
    convo.next();
  }, {key:"week"});
}

askPositive = function(response, convo) {
  convo.ask("What are you proudest about this week?", function(response, convo) {
    convo.say("Ok.")

    askDevelop(response, convo);
    convo.next();
  }, {key:"proud"});
}

askDevelop = function(response, convo) {
  convo.ask("So what do you want to get better at?", function(response, convo) {
    convo.say("Ok! ");

    askQuestions(response, convo);
    convo.next();
  }, {key:"improve"});
}

askQuestions = function(response, convo) {
  convo.ask("Do you have any questions or comments you want to forward to Thom", function(response, convo) {
    convo.say("Ok! ");

    var responses = convo.extractResponses();
    console.log(responses);
    closeSurvey(response, convo);

  }, {key:"questions"});
}

//

closeSurvey = function(response, convo) {
    convo.on('end',function(convo) {
  if (convo.status=='completed') {
    // do something useful with the users responses
    var res = convo.extractResponses();
    //notify a coach that a survey was completed

    // reference a specific response by key
    var value  = convo.extractResponse('key');
    // ... do more stuff...
  } else {
    // something happened that caused the conversation to stop prematurely
  }
});
}
//utility methods
parseTimeStamp = function(time) {
    var when = moment.unix(time);
    return moment(when).fromNow();
}
//method to query which users
//reflect answers
//store in a json
//send the info to keystone
