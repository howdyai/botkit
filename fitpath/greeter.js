var Botkit = require('../lib/Botkit.js');
var db = require('../lib/storage/simple_storage.js');
var _ = require('underscore');

var controller = Botkit.slackbot({
  debug: false,
  json_file_store: '../db/',
  //include "log: false" to disable logging
  //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

// connect the bot to a stream of messages
var bot = controller.spawn({
  token: 'xoxb-24467141840-V3Jv2H3UMV14ZugggTFI4QUY',
}).startRTM()

// give the bot something to listen for.
// controller.hears('hello',['direct_message','direct_mention','mention'],function(bot,message) {
//
//   bot.reply(message,'Hello yourself.');
//
// });

/**
* User team_join botkit event
*/

controller.on('user_channel_join', function(bot, message) {
     bot.startPrivateConversation({user: message.user}, welcome);
});

controller.hears('start-survey',['direct_message'],function(bot,message) {
   bot.startPrivateConversation({user: message.user}, welcome);
   console.log('greeter up');
});

// Start conversation
welcome = function(response, convo) {
  
    var intro = {
       'username': 'willow' ,
       'attachments': [
         {
           'fallback': 'Welcome to the Rookie2Rockstar program and FitPath community!',
           'title': 'Hi! I\'m Willow the Wellbot. Welcome to the FitPath community!',
           'text': 'Theres a few important things I\'d like to go over to get you settled in.',
           'color': '#4FC3F7'
         },
         {
           'text': 'This is a closed messaging site that we use so the community can share and discuss among a variety of topics. \n' +
                   'You can post your workouts in \'workout_logs\' or setup a private channel for only you and Thom. \n' +
                   'You can also turn on Do Not Disturb in your settings for a specific time period.',
           'color': '#FFF176'
         },
         {
           'text': 'I\'m going to be used for a few very important things:',
           'fields': [
              {
                "title": 'Track Workouts',
                "short": 'true'
              },
              {
                "title": 'Record Nutrition',
                "short": 'true'
              },
              {
                "title": 'Learn about stuff',
                "short": 'true'
              },
              {
                "title": 'Talk to Thom',
                "short": 'true'
              },
              {
                "title": 'Meet other Rockstars with similar interests',
                "short": 'true'
              },
              {
                "title": 'Get daily reminders for Habits and be held accountable',
                "short": 'true'
              }
           ],
           'color': '#F06292'
         },
         {
           'text': 'Let me know when you\'re ready to continue! (ready / later - for now)',
           'color': '#81C784'
         }
       ],
       'icon_url': 'https://i.imgsafe.org/1c507fe.jpg',
       'mrkdwn': true

    }

    convo.ask(intro, function(response, convo) {
      if(response.text == 'ready') {
        survey(response, convo);
        convo.next();
      }
      // else {
      //   var comeback = {'username': 'Willow', 'text': 'Make sure '};
      //   convo.say(comeback);
      //   convo.next();
      // }
    }, {key: "decision"});

}

survey = function(response, convo){
    convo.say('Awesome, we just need to learn a little bit about you first');
    convo.say('We can do the survey here, or on a Typeform, which is just another type of survey, but more visual and a little less typing');
    var question = 'Would you prefer we do it here or on Typeform?';

    convo.ask(question, function(response, convo) {
      if(response.text == 'typeform' || response.text == 'Typeform') {
        console.log('here');
        var typeform = {
          'username': 'willow',
          'attachments': [
            {
              'fallback': 'You choose typeform!', 
              'title': 'FitPath Typeform',
              'title_link': 'https://thom4.typeform.com/to/toYQMK'
            }
          ],
          'icon_url': 'https://i.imgsafe.org/1c507fe.jpg',
          'mrkdwn': true
        }
       convo.say(typeform);
       typeformSurvey(response,convo);
       convo.next();
      }
      else if(response.text == 'here') {
        convo.say('Awesome! Just remember it can be as long as you want, just send one response per question');
        convo.say('You can simply skip a question by pressing *enter*');
        injury(response,convo);
        convo.next();
      }
      else {
        convo.say('Alright, just make sure to come back and finish this later by typing \'finish survey\', its important!')
      }
    }, {key: "surveyType"});
}

typeformSurvey = function(response, convo) {
  var statement = 'Awesome, I\'ll let Thom know you took the typeform! \n Hope you enjoy your stay at the Rockstar community!';
  convo.say(statement);
  surveyNotification(convo.source_message.user, 'Typeform');
 }

injury = function (response, convo) {
   surveyNotification(convo.source_message.user, 'here');
   var question = 'So, Tell me about your previous injuries';
   convo.ask(question, function(response, convo) {
     goals(response,convo);
     convo.next();
   }, {key: "injury"});
}

goals = function (response, convo){
  var question = 'What are you the main goals you want to accomplish in the Rookie2Rockstar program?';
  convo.ask(question, function(response, convo) {
    habits(response,convo);
    convo.next();
  }, {key: "goals"});
}

habits = function (response, convo) {
  var question = 'What would you say your current eating habits are like?';
  convo.ask(question, function(response, convo) {
    /**
    if (bot.utterences == good) {
      convo.say('Awesome!')
    }
    if(bot.utterences == okay) {
      convo.say('Still pretty good!')
    }
    if(bot.utterences == bad) {
      convo.say('Thats alright, we're all here to get better!)
    }
    */
    grocery(response,convo);
    convo.next();
  }, {key: "habits"});
}

grocery = function (response, convo) {
  var question = 'When you goto the grocery store, what is your cart usually filled with?';
  convo.ask(question, function(response, convo) {
    prep(response,convo);
    convo.next();
  }, {key: "grocery"});
}

prep = function (response, convo) {
  var question = 'Do you prepare your food at all? If so, how?';
  convo.ask(question, function(response, convo) {
    hydration(response,convo);
    convo.next();
  }, {key: "prep"});
}

hydration = function (response, convo) {
  var question = 'How do you get most of your water throughout the day?';
  convo.ask(question, function(response, convo) {
    experience(response,convo);
    convo.next();
  }, {key: "hydration"});
}

experience = function (response, convo) {
  var question = 'How active is your current lifestyle?';
  convo.ask(question, function(response, convo) {
    preferences(response,convo);
    convo.next();
  }, {key: "experience"});
}

preferences = function (response, convo) {
  var question = 'What type of workouts do you most enjoy?';
  convo.ask(question, function(response, convo) {
    strengths(response,convo);
    convo.next();
  }, {key: "preferences"});
}

strengths = function (response, convo) {
  var question = 'What are your strengths?';
  convo.ask(question, function(response, convo) {
    weaknesses(response,convo);
    convo.next();
  }, {key: "strengths"});
}

weaknesses = function (response, convo) {
  var question = 'What aobut your weaknesses?';
  convo.ask(question, function(response, convo) {
    other(response,convo);
    convo.next();
  }, {key: "weaknesses"});
}

other = function (response, convo) {
  var question = 'Almost done! Anything else you\'d like to tell us?';
  convo.ask(question, function(response, convo) {
    convo.next();
  }, {key: "other"});

  convo.on('end', function(convo) {
      if (convo.status=='completed') {
      // do something useful with the users responses
      var res = convo.extractResponses();
      console.log(res);
      surveyResponses(convo.source_message.user, res);
      console.log(res);
      
      // reference a specific response by key
      //var value  = convo.extractResponse('key');
      // ... do more stuff...


    } else {
      // something happened that caused the conversation to stop prematurely
    }
  });
}

function save(id, response) {
    controller.storage.users.save({id: id, response}, function(err) {
        console.log(err);
    });
}

// Parse User Ids from response

function users(response) {
   var list = _.filter(response.members, function(member) {
       return member.is_bot == false && member.id != 'USLACKBOT';
   })
   var ids =  _.pluck(list, "id");
   return ids;
}

function surveyNotification(id,surveyType) {

  if (surveyType == 'here') {
    surveyType = 'me'
  }

  // bot.api.users.info({user: id},function(err,response) {
  //   if(response){
  //     sendNotification(response.user.name, surveyType);
  //   }
  //   else {
  //     console.log(err);
  //   }
  // })
  
  sendNotification(id, surveyType);
  
  // Start A Survey
  function sendNotification(id, surveyType){
   
      var attachments = {
       'username': 'willow',
       'channel': 'C0NGETH71',
       'attachments': [
         {
           'fallback': '<@' + id + '> started a survey with ' + surveyType,
           'text': '<@' + id + '> started a survey with ' + surveyType,
           'color': '#4FC3F7',
         },
       ],
       'icon_url': 'https://i.imgsafe.org/1c507fe.jpg',
       'mrkdwn': true
      }
    
    bot.say(attachments, function(err, response) {
      if(response){
        console.log(response);
      }
      else {
        console.log(err);
      }
    });
      
  }
}

function surveyResponses(id, responses) {
  
    sendSurveyResponses(id, responses);
  
    function sendSurveyResponses(id, responses) {
      
       var text = surveyResponseToString(responses);
  
       var attachments = {
          'username': 'willow',
          'channel': 'C0NGETH71',
          'attachments': [
            {
              'fallback': '<@' + id + '> just finished their survey with me',
              'title': '<@' + id + '> just finished their survey with me',
              'text': text,
              'color': '#81C784',
              'mrkdwn_in' : [
                "text",
                "title",
                "fallback"
              ]
            },
          ],
          'icon_url': 'https://i.imgsafe.org/1c507fe.jpg',
        } 
      
      bot.say(attachments); 
      
    }

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

