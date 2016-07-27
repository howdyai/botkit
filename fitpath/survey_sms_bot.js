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

var config = require('./env.js');
var request = require('request');

var counter = 0;
var _ = require('underscore');

var convoObject =
   {
     userId: '5784f67bf87bfc21174bc93f',
     userMedium: 'slack',
     userContactInfo: {name: 'jlaver', phoneNumber: '+15064261732', slackId: 'U136W8M0W'},
     questions: [
       {question: 'Do you like pancakes?'},
       {question: 'Do you like waffles?'},
       {question: 'Do you like french toast?'}
     ],
     surveyId: '35435436afaf',
     type: 'survey'
 };



//console.log(config.phoneNumber);


//var convoObject;
var controller = Botkit.twiliosmsbot({
  account_sid: 'ACf83693e222a7ade08080159c4871c9e3',
  auth_token: '20b36bd42a33cd249e0079a6a1e8e0dd',
  twilio_number: config.phoneNumber
});

var bot = controller.spawn({});

controller.setupWebserver(27182, function (err, webserver) {
  controller.createWebhookEndpoints(controller.webserver, bot, function () {
    console.log('Online');
  });
});


module.exports.receiveConvo = function(convo){


  console.log('received Convo');
  console.log(JSON.stringify(convo));
  //, channel:'C0NGETH71'
  var convoObject = convo;



  console.log("Starting a convo");
  console.log(convoObject);

  var ask1 = function(response, convo){
    console.log("ask1");
    convo.convoObject = convoObject;

    if(convo.convoObject.questions[0]){
      console.log("past if");
      convo.say("Awesome.");
      console.log(convo.convoObject.questions[0].question);
      convo.ask(convo.convoObject.questions[0].question, function(response, convo) {

        convo.say("Awesome.");
        console.log("ask2 start here");
        console.log(convo);

        //breaking with 2 different surveys at the same time
        convo.next();
        console.log("after next");

        ask2(response, convo);

      });

    }else{
      convo.say("Bye");
      closeSurvey(response,convo);
      convo.next();
    }
  }

  var ask2 = function(response, convo){
    console.log("ask2");
    if(convo.convoObject.questions[1]){
      console.log("past if");

      convo.ask(convo.convoObject.questions[1].question, function(response, convo) {

        convo.say("Awesome.");
        ask3(response, convo);
        convo.next();
      });

    }else{
      convo.say("Bye");
      closeSurvey(response,convo);
      convo.next();
    }

  }

  var ask3 = function(response, convo){
    console.log("ask3");
    if(convo.convoObject.questions[2]){
      console.log("past if");

      convo.ask(convo.convoObject.questions[2].question, function(response, convo) {

        convo.say("Awesome.");
        ask4(response, convo);
        convo.next();
      });

    }else{
      convo.say("Bye");
      closeSurvey(response,convo);
      convo.next();
    }
  }

  var ask4 = function (response, convo) {
    console.log("ask4");
    if(convo.convoObject.questions[3]){
      console.log("past if");

      convo.ask(convo.convoObject.questions[3].question, function(response, convo) {

        convo.say("Awesome.");
        ask5(response, convo);
        convo.next();
      });

    }else{
      convo.say("Bye");
      closeSurvey(response,convo);
      convo.next();
    }

  }
  var ask5 = function(response, convo){
    console.log("ask5");
    if(convo.convoObject.questions[4]){
      console.log("past if");

      convo.ask(convo.convoObject.questions[4].question, function(response, convo) {

        convo.say("Awesome.");
        convo.say("Bye");
        closeSurvey(response,convo);
        convo.next();
      });

    }else{
      convo.say("Bye");
      closeSurvey(response,convo);
      convo.next();
    }

  }

  closeSurvey = function(response, convo) {
    convo.on('end',function(convo) {

      if (convo.status=='completed') {
        // do something useful with the users responses
        var res = convo.extractResponses();
        console.log(res);

        //ok now format the responses
        submitResponse(res, convo);

        // reference a specific response by key
        //var value  = convo.extractResponse('key');

        // ... do more stuff...

      } else {
        // something happened that caused the conversation to stop prematurely
      }

    });

  }
  submitResponse = function(res, convo) {
    var response = {};
    response.assignment = convo.convoObject.assignmentId;
    response.userId = convo.convoObject.userId;
    response.timeStamp = Date.now();
    // if(typeof convo.convoObject.surveyTemplateId !== 'undefined' && variable !== null){
    //   response.surveyTemplateId = convo.convoObject.surveyId;}
    // else if(typeof convo.convoObject.reminderId !== 'undefined' && variable !== null) {response.reminderId = convo.convoObject.surveyId;}
    //
    if(convo.convoObject.type && convo.convoObject.type === 'survey'){
        console.log('server');
        console.log(convo.convoObject.surveyId);
        response.surveyTemplateId = convo.convoObject.surveyId;
    }
    else if (convo.convoObject.type && convo.convoObject.type === 'reminder'){
      console.log('server');
      console.log(convo.convoObject.reminderId);
      response.reminderId = convo.convoObject.reminderId;
    }



    response.questions = [];
    for (var i = 0; i < convo.convoObject.questions.length; i++) {
      var question = convo.convoObject.questions[i].question;
      console.log('Question: ' + question);
      // Responses are indexed by the question as a key
      console.log('Response: ' + response);
      // Push the response onto the responseArray
      //responseArray.push(response);
      response.questions[i] = convo.convoObject.questions[i];
      response.questions[i].answer = res[question];
      console.log(response.questions[i].answer);
    }

    request.post({url: 'http://' + config.serverIp + ':12557/api/response/create', json: true, body: response}, function (err, response, body) {
      console.log(err);
      console.log(response.questions);
      console.log(body);
    });

  }

  function surveyResponseToString(surveyObj) {

    var result = _.reduce(surveyObj, function(output, item, key, surveyObj) {
      if (key === Object.keys(surveyObj)[1]) {
       output = "*" + Object.keys(surveyObj)[0] + "*: " + output + "\n";
      }
      return output + "*" + key + "*: " + item + "\n";

    });
    return result;
  }


  console.log(convoObject.userContactInfo.phoneNumber);
  console.log(convoObject.type);
  bot.startPrivateConversation({user: convoObject.userContactInfo.phoneNumber, text: ''}, ask1);


}


module.exports.receiveConvo(convoObject);
