//botkit
// language parser


// Send global message, asking if anyone would like to be reminded

// If yes,

    //loop
        // first ask what they would like to be remindeded of
        // ask on what days they would like to be reminded  (how often they would like to be reminded during the week)
        // ask on what times they would like to be reminded (how often would they like to be reminded during the day)

    // ask if they would like to contine
//

var Botkit = require('../lib/Botkit.js');
var moment = require('moment');
             require('moment/locale/en-ca');
var _ = require('underscore')
var momentTimezone = require('moment-timezone');

var token = 'xoxp-21143396339-21148553634-24144454581-f6d7e3347d';
var sent = 0;
var responded = 0;


// Timezone fix, subtracted 1 hour from all reminders
// Server hosted on EST, thus LT = EST
var reminder = {
  "reminders": [

    {"name": "ashley","id": "U0P21DF34","description": "Did you send Thom that nutrition report?", "time": "9:00 AM", "im_id": "D0S7EDLRL"},
    {"name": "jennrussellph", "id": "U0MH3FE3X", "description": "Did you drink water and give Thom a utrition update?", "time":"9:00 AM", "im_id": "D0S666XDH"},
    {"name": "g33k_g1rl", "id": "U0MHQ7ACE", "description": "Did you remember to drink water?", "time": "1:00 PM", "im_id": "D0MHL6PB7"},
    {"name": "g33k_g1rl", "id": "U0MHQ7ACE", "description": "Did you do your stretching?", "time": "7:00 PM", "im_id": "D0MHL6PB7"},
    {"name": "julie", "id": "U0MH319A7", "description": "Did you remember to track those workouts?", "time": "5:00 AM", "im_id": "D0S7N7KA9" },
    {"name": "matt", "id": "U0M49UJ4V", "description": "Did you remember to drink your water, and send Thom that journal update?", "time": "9:00 AM", "im_id": "D0M4E25G8" },
    {"name": "goldiloks1", "id": "U0MHFGB7C", "description": "Did you track your workouts?", "time": "12:00 PM", "im_id": "D0MHCN011" },
    {"name": "mamajess23", "id": "U0N1Q6Y3E", "description": "Did you drink your water today?", "time": "8:30 AM", "im_id": "D0N1W7ERG" },
    {"name": "mamajess23", "id": "U0N1Q6Y3E", "description": "Did you call Thom today?", "time": "5:00 PM", "im_id": "D0N1W7ERG" },
    {"name": "jameslock", "id": "U0NRFEY6Q", "description": "Did you remember to, drink water & stretch?", "time": "9:00 AM", "im_id": "D0NRN2MT8" },
    // John Adams Workout - is EST
    {"name": "jonathan.adams", "id": "U0P2H7KL7", "description": "John, did you get to that workout?", "time": "7:00 AM","im_id": "D0S81R36E"},
    {"name": "cojo", "id": "U0M4CG9JN", "description": "Did you drink your water today?", "time": "10:24 AM"},
    {"name": "thom", "id": "U0M4AB3M0", "description": "", "time": "5:00 PM"}

  ]
}

var outgoing = [];

var controller = Botkit.slackbot({
    json_file_store: '../db/',
    debug: false
});

var bot = controller.spawn({
  token: 'xoxb-24467141840-V3Jv2H3UMV14ZugggTFI4QUY',
  json_file_store: '../db/',
}).startRTM()

init();

controller.hears('show reminders', ['direct_mention', 'direct_message'], function(bot,message) {
  var reminders = JSON.stringify(reminder);
  console.log(reminders);
  bot.say({
    text: reminders,
    channel: message.channel
  });
});

// controller.hears('reminders-test', ['direct_mention', 'direct_message'], function(bot, message) {
//   bot.startPrivateConversation(message, function(response, convo) {
//     var question = {
//       'username': 'willow',
//       'attachments': [
//         {
//           'fallback': 'You have a reminder!',
//           'title': 'Remember',
//           'text': reminder,
//           'color': '#81C784',
//         }
//       ],
//       'icon_url': 'https://i.imgsafe.org/1c507fe.jpg',
//       'mrkdwn': true
//     }

//     convo.ask(question, function(response, convo) {
//         convo.next();
//     });

//   });
// });


// controller.hears('all', ['direct_mention'], function(bot, message) {
//     bot.startPrivateConversation(message, function(response, convo){
//       var question = 'Thom would like to know if you\'d like to setup any reoccuring reminders';
//       convo.ask(question, [
//         {
//           pattern: bot.utterances.yes,
//           callback: function(response, convo) {
//               convo.say('yes');
//               convo.next();
//           }
//         },
//         {
//           pattern: bot.utterances.no,
//           callback: function(response, convo) {

//           }
//         }
//       ]);
//     });
// });

// reminder = function(response, convo) {
//   convo.ask("So, what would you like to be reminded of?", function(response, convo) {
//     convo.say("Sure thing.");
//     days(response,convo);
//   });
// }

// days = function(response, convo) {
//   convo.ask("On what days would you like to be reminded?", function(response, convo) {
//     time(response,convo);
//   });
// }

// time = function(response, convo) {
//   convo.ask("What times during the day would you like to be reminded?", function(response, convo) {

//   });

//   convo.on('end', function(convo) {
//     if(convo.status == 'completed') {
//       var res = convo.extractResponses();
//     }
//   });
// }








// function users(response) {

//    var list = _.filter(response.members, function(member) {
//        return member.is_bot == false && member.id != 'USLACKBOT';
//    })
//    var ids =  _.pluck(list, "id");

//    return ids;

// }

function init(){
  setInterval(
    function() {
      reminderTimeCheck();
    },
    60 * 1000
  );
}

function reminderTimeCheck() {
  var now = moment().format('LT');
  _.each(reminder.reminders, function(value, key, items){
    if(value.time == now) {
      if (value.id == 'U0M4AB3M0') {
        remindThom();
      }
      else {
        remind(value.description, value.id, value.name);
      }
    }
  });
}



function reminderResponse(name, habit, response) {

       var attachments = {
        'username': 'willow',
        'channel': 'C0PTSK94H',
        'attachments': [
          {
            'fallback': name + ' has responed to a reminder',
            'title': habit,
            'text': '<@' + name + '>:' + response,
            'color': '#81C784',
          }
        ],
        'icon_url': 'https://i.imgsafe.org/1c507fe.jpg',
        'mrkdwn': true
      }
      bot.say(attachments);

}

function hasBeenSent(name, habit) {

  var attachments = {
    'username': 'willow',
    'channel': 'C0PTSK94H',
    'attachments': [
      {
        'fallback': 'A habit has been sent to ' + '<@' + name + '>' + '!',
        'title': habit,
        'text': '<@'+name + '>' + ' has recieved their reminder',
        'color': '#4FC3F7',
      }
    ],
      'icon_url': 'https://i.imgsafe.org/1c507fe.jpg',
      'mrkdwn': true
  }
  bot.say(attachments);
  sent++;
}

function remindThom() {
  bot.startPrivateConversation({user: 'U0M4AB3M0'}, function(response, convo) {
    var summary = {
      'username': 'willow',
      'attachments': [
        {
          'fallback': 'Today\'s Reminder Summary',
          'title': 'Today\'s Reminder Summary:',
          'text': 'Today, there were *' + sent + '* reminders sent.',
          'color': '#ef5350',
          'mrkdwn_in': ['text']
        },
        {
          'text': 'Out of that, there were *' + responded + '* reminders responded to.',
          'color': '#81C784',
          'mrkdwn_in': ['text'],
        }
      ],
      'icon_url': 'https://i.imgsafe.org/1c507fe.jpg',
    }

    convo.say(summary);
  });
}

function remind(reminder, id, name) {

  bot.startPrivateConversation({user: id}, function(response, convo) {

    var question = {
      'username': 'willow',
      'attachments': [
        {
          'fallback': 'You have a reminder!',
          'title': 'Reminder:',
          'text': reminder,
          'color': '#81C784',
        }
      ],
      'icon_url': './willow.png',
      'mrkdwn': true
    }

    hasBeenSent(name,reminder);

    convo.ask(question, function(response, convo) {
        convo.next();
    }, {key: "habit"});

    convo.on('end',function(convo) {

      if (convo.status=='completed') {
        // do something useful with the users responses
        var res = convo.extractResponses();
        // reference a specific response by key
        var value  = convo.extractResponse('habit');
        //info(convo.responses.habit.user);
        reminderResponse(name, reminder, value);
        responded++;
        //habitResponse()
        // bot.say({
        //   text: 'Name: ' +  name + '\n' + 'Habit: ' + convo.sent.text + ''
        // convo.sent.text
        // });



        // ... do more stuff...

      } else {
        // something happened that caused the conversation to stop prematurely
      }

    });

  });
}

function hasOutgoing(userID,convoID) {

}
