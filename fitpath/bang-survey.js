var Botkit = require('../lib/Botkit.js');
var moment = require('moment');
var _ = require('underscore');
var request = require('request');
var rp = require('request-promise');
var db = require('../lib/storage/simple_storage.js');

var responses = [];
var users = [];
var clients_id = [];
var clients_name = [];

//set this flag to a process.env.debug flag prob
var controller = Botkit.slackbot({
  json_file_store: '../db/',
  debug: false
  //include "log: false" to disable logging
  //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

// connect the bot to a stream of messages
var bot = controller.spawn({
  token: 'xoxb-37920661316-Umfkqk2AxA5glTiQS4vMqNdT',//josh_bot token
  json_file_store: '../db/'
}).startRTM()

/*
 Activing the survey
*/
controller.hears(['sendsurvey'],['direct_message'],function(bot,message) {
  console.log("Get Users");
  var options = {
    uri: 'https://slack.com/api/users.list',
    qs: {
        token: 'xoxp-21143396339-21146377714-22731192086-16bf020b08', // -> uri + '?access_token=xxxxx%20xxxxx'
        pretty: 1
    },
    headers: {
        'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
  };

  rp(options)
    .then(function (repos) {
        users = repos.members;
        console.log(users);

        /*
          Sorting out the bots and putting id's and name's in two different arrays
        */
        for(i = 0; i< users.length; i++){
          if(users[i].is_bot || users[i].name === 'slackbot'){
            //kick the bots out of the array
          }
          else{
            clients_id.push(users[i].id);
            clients_name.push(users[i].name);
          }
        }

        //console.log(clients_id);
        //console.log(clients_name);

        /*
          Comment this out when using every user in team
        */
        clients_id = [
          'U0M49UJ4V', //Matt
          //'U0M4AB3M0', //Thom
          //'U0S68V5PX', //jo
          'U1457G26Q' //josh_tester
        ];

        console.log("Start Conversations");
        _.each(clients_id, function(id) {
          // init convo function
          sendSurvey(id);

        }, clients_id);

    })
    .catch(function (err) {
        // API call failed...
    });
});

/*
  Sending survey to everyone in array
*/
function sendSurvey(id){
      //console.log(id)
      console.log("Have to send Survey!");
      bot.startPrivateConversation({user: id}, function(response, convo) {
        console.log("Conversation Started!");
        start(response, convo);
        convo.next();
    });

  }

/*
 Start of the survey conversation
*/
start = function(response, convo) {
  convo.ask("Hey, " + '<@' + convo.source_message.user + '> ' +  "time for a survey!", function(response, convo){
    convo.say("Goal is to figure out level of readiness in nutritional change!")
    question_1(response, convo);
    convo.next();
  }, {key: "start"});
}

question_1 = function(response, convo) {
  convo.ask("What does success look like to you? \n Examples - pounds on the bar \n\t Look better \n\t Feel better \n\t Have more energy", function(response, convo) {

    question_2(response, convo);
    convo.next();
  }, {key:"success"});
}

question_2 = function(response, convo) {
  convo.ask("Do you feel making changes to your nutrition will help you be happier with your results? (yes/no) \n Explain", function(response, convo) {

    question_3(response, convo);
    convo.next();
  }, {key:"nutrition"});
}

question_3 = function(response, convo) {
  convo.ask("What is the most significant thing you could change about your nutrition to get the results you want?", function(response, convo) {

    question_4(response, convo);
    convo.next();
  }, {key: "change"});
}

question_4 = function(response, convo) {
  convo.ask("Are you willing to do that?", function(response, convo) {

    question_5(response, convo);
    convo.next();
  }, {key:"meaningful"});
}

question_5 = function(response, convo) {
  convo.ask("Would you like me to check in with you each day to help you make this change?", function(response, convo) {

    question_6(response, convo);
    convo.next();
  }, {key:"check in"});
}

question_6 = function(response, convo) {
  convo.ask("What is the best time of day to check in?", function(response, convo) {
    convo.say("Thank You for doing the survey!");

    var responses = convo.extractResponses();
    console.log(responses);
    console.log("here");
    convo.next();
    closeSurvey(response, convo);
  }, {key:"time"});
}

/*
  Survey has finished
*/
closeSurvey = function(response, convo) {
  convo.on('end', function (convo) {
      if(convo.status == 'completed') {
        var res = convo.extractResponses();
        var user = convo.source_message.user;
        console.log(user);
        console.log(res);
        // console.log(convo);
        //Outputting to channel
        sendResponses(res, user);
      }
      else {
        console.log("Error");
    // something happened that caused the conversation to stop prematurely
      }
});
}
/*
 Outputting responses to survey channel(Make sure bot is define)
*/
function sendResponses(response, id){
  var responses = surveyResponseToString(response);
  console.log('sned Responses');
  var attachments = {
    'username': 'survey',
    'channel': 'C0NGETH71',
    'attachments': [
      {
        'text': responses,
        'color': '#81C784',
        'title': '<@' + id + '>' + ' has completed their weekly survey!',
        'fallback': '<@' + id + '>' + ' has completed their weekly survey!',
        'mrkdwn_in' : [
          'text',
          'title',
          'fallback'
        ]
      }
    ],
    'icon_url': 'https://i.imgsafe.org/1b33b2f.png'
  }
  console.log(attachments);
  bot.say(attachments);
}
/*
  Formating responses
*/
function surveyResponseToString(surveyObj) {

  var result = _.reduce(surveyObj, function(output, item, key, surveyObj) {
    if (key === Object.keys(surveyObj)[1]) {
     output = "*" + Object.keys(surveyObj)[0] + "*: " + output + "\n";
    }
    return output + "*" + key + "*: " + item + "\n";

  });
  return result;
}
