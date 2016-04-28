var Botkit = require('../lib/Botkit.js');
var moment = require('moment');
var responses = [];
var _ = require('underscore');
var index = 0;
var dndStatus = [];
var production = false;
var users = [];
var clients_id = [];
var clients_name = [];
var request = require('request');
var rp = require('request-promise');
var db = require('../lib/storage/simple_storage.js');

//set this flag to a process.env.debug flag prob

var controller = Botkit.slackbot({
  json_file_store: '../db/',
  debug: false
  //include "log: false" to disable logging
  //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

// connect the bot to a stream of messages
var bot = controller.spawn({
  token: 'xoxb-37920661316-Umfkqk2AxA5glTiQS4vMqNdT',
  json_file_store: '../db/'
}).startRTM()






controller.storage.users.all(function(err, all_user_data){});
controller.hears(['b4c-weekly-survey'],['direct_message'],function(bot,message) {
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
        //console.log(users);
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
        clients_id = [
          //'T0M47BN9Z', //Matt
          //'U0M4AB3M0', //Thom
          //'U0S68V5PX', //jo
          'U1457G26Q' //josh_tester
        ];

        console.log("Start Conversations");
        _.each(clients_id, function(id) {
          // init convo function
          sendSurvey(id, bot);

        }, clients_id);

    })
    .catch(function (err) {
        // API call failed...
    });
});

function sendSurvey(id, bot){
      console.log(id)
      console.log("Have to sendSurvey!");
      bot.startPrivateConversation({user: id}, function(response, convo) {
      console.log("Conversation Started!");
      start(response, convo);
      convo.next();
    });

  }

start = function(response, convo) {
  convo.ask("Hey, " + '<@' + convo.source_message.user + '> ' +  "time for your weekly survey!", function(response, convo){
    week(response, convo);
    convo.next();
  }, {key: "start"});
}

week = function(response, convo) {
  convo.ask("What week are you evaluating?(1-6)", function(response, convo) {

    closeSurvey(response, convo);
    convo.next();
  }, {key:"week"});
}

closeSurvey = function(response, convo) {
  convo.on('end', function (convo) {
      console.log("Hi");

      if(convo.status == 'completed') {
        var res = convo.extractResponses();
        var user = convo.source_message.user;

        console.log(user);
        console.log(res);

        // console.log(convo);
        sendResponses(res, user);

      }
      else {
        console.log("Error");
    // something happened that caused the conversation to stop prematurely
      }
});
}
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

function surveyResponseToString(surveyObj) {

  var result = _.reduce(surveyObj, function(output, item, key, surveyObj) {
    if (key === Object.keys(surveyObj)[1]) {
     output = "*" + Object.keys(surveyObj)[0] + "*: " + output + "\n";
    }
    return output + "*" + key + "*: " + item + "\n";

  });
  return result;

}
