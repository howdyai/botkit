var Botkit = require('../lib/Botkit.js');
var db = require('../lib/storage/simple_storage.js');
var _ = require('underscore');
var moment = require('moment');

// var checkIn = 'Thursday';
//var token ='xoxp-21143396339-21148553634-24144454581-f6d7e3347d';

var recipients = [
                    'U0P21DF34',
                    'U0MHQ7ACE',
                    'U0MHFGB7C',
                    'U0NRFEY6Q',
                    'U0MH3FE3X',
                    'U0P2H7KL7',
                    'U0MH319A7',
                    'U0NR18WEB',
                    'U0RNQNCNL',
                    'U0N1Q6Y3E',
                    'U0NR545GB',
                    'U0M49UJ4V',
                    'U0P7APG7L',
                    'U0R8JF05D',
                    'U0PG44EU8',
                    'U0M4CG9JN',
                    'U0M4AB3M0'

]

var controller = Botkit.slackbot({
  json_file_store: '../db/',
  debug: false
  //include "log: false" to disable logging
  //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

// connect the bot to a stream of messages
var bot = controller.spawn({
  token: 'xoxb-25936133958-GUwHEhR9XPJgMOPZBrQblX4W',
  json_file_store: '../db/'
}).startRTM()

controller.hears('sendweeklysurvey', ['direct_message'], function(bot, message) {
  init();
});

// init();

askOverall = function(response, convo) {
     //get user name
 // convo.sayFirst("Hi," + " I'm Willow");

  convo.ask("Hey, " + '<@' + convo.source_message.user + '> ' +  ",how is your week going?", function(response, convo) {
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
    askWellbeing(response, convo);
    convo.next();
  }, {key:"improve"});
}


askWellbeing = function (response, convo) {
  convo.ask("Have you noticed any improvements in your general well being due to taking better care of yourself?", function(response, convo) {
    askScale(response, convo);
    convo.next();
  }, {key: "wellbeing"});
}

askScale = function(response, convo) {
  convo.ask("On a scale from 1 - 5, how well do you think you're doing?", function(response, convo) {
    askQuestions(response, convo);
    convo.next();
  }, {key:"scale"});
}

askQuestions = function(response, convo) {
  convo.ask("Do you have any questions or comments you want to forward to Thom?", function(response, convo) {
    convo.say("All done, Thanks! Remember to drink your water! ");
    convo.next();
  }, {key:"questions"});

  convo.on('end', function (convo) {
      if(convo.status == 'completed') {
        var res = convo.extractResponses();
        var user = convo.source_message.user;
        console.log(user);
        console.log(res);
        // console.log(convo);
        sendResponses(res, user);
      }
   });

}

// function users(response) {

//    var list = _.filter(response.members, function(member) {
//        return member.is_bot == false && member.id != 'USLACKBOT';
//    })
//    var ids =  _.pluck(list, "id");

//    return ids;

// }

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


function initWeeklySurvey() {
    console.log('init surbey');
  _.each(recipients, function(id) {
    // init convo function
    sendSurvey(id);

  }, recipients);

}

function sendSurvey(id) {
  console.log('sendSurvey');
  bot.startPrivateConversation({user: id}, function(response, convo) {
    askOverall(response, convo);
    convo.next();
  });
}

function dayCheck() {
  console.log('dayCheck');
  var current = moment().format('dddd');
  if (current == checkIn) {
    initWeeklySurvey();
  }
}
// Checks every 1 hour
function init() {
  // console.log('init');
  // setInterval(
  //   function() {
  //     dayCheck();
  //   },
  //   60 * 1000
  // );
  initWeeklySurvey();
}
// convo.source_message.user

function surveyResponseToString(surveyObj) {

  var result = _.reduce(surveyObj, function(output, item, key, surveyObj) {
    if (key === Object.keys(surveyObj)[1]) {
     output = "*" + Object.keys(surveyObj)[0] + "*: " + output + "\n";
    }
    return output + "*" + key + "*: " + item + "\n";

  });
  return result;

}
