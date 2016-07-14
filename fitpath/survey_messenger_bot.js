var Botkit = require('../lib/Botkit.js');

// For testing purposes; this should be stored on the FitPath side of things and passed in
var authMessage;

var ConvoObjects = [
  {
    userId: '5754345drt4654353',
    userMedium: 'sms',
    userContactInfo: {name: 'Josh', phoneNumber: '+15064261732'},
    questions: [
      'Do you like pancakes?',
      'Do you like waffles?',
      'Do you like french toast?'
    ],
    surveyId: '35435436afaf'
  },
  {
    userId: '3456ytrafda',
    userMedium: 'sms',
    userContactInfo: {name: 'Bob', phoneNumber: '+15064261732'},
    questions: [
      'Do you like pancakes?',
      'Do you like waffles?',
      'Do you like french toast?'
    ],
    surveyId: '32432534642'
  },
  {
    userId: '34q4wq4',
    userMedium: 'sms',
    userContactInfo: {name: 'George', phoneNumber: '+15064706220'},
    questions: [
      'Do you like pancakes?',
      'Do you like waffles?',
      'Do you like french toast?'
    ],
    surveyId: '23432423'
  }
];

var controller = Botkit.facebookbot({
  access_token: 'EAADXmpOGmZBQBANBroHGZALtvFVdZCzmlDAsbfozQIuvyCI8ZCVb1NECI7aYK3DRIyv6M9BVNI4YcjYCMASRuO6F9K9VQzCRpvZCUKwJ6TelQBisUZCJlcznkzrwVORv0h9krL6jbzWlxmEYi9Tn660Wig6lWW4YrZA5qKjx0elywZDZD',
  verify_token: 'FISHTACOS'
});

var bot = controller.spawn({});

controller.setupWebserver(27182, function (err, webserver) {
  controller.createWebhookEndpoints(controller.webserver, bot, function () {
    console.log('TwilioMessengerBot is online!');
  });
});

controller.on('facebook_optin', function (bot, message) {
  authMessage = message;
  console.log(authMessage);
});

controller.hears(['hi', 'hey', 'hello', 'heya', 'ello', 'howdy'], 'message_received', function (bot, message) {
  bot.reply(message, 'Hi! I\'ll be sending a survey to you shortly.');
  authMessage = message;
  console.log(message);
});

controller.hears('remind me to (.*) at (.*)', 'message_received', function (bot, message) {
  bot.reply(message, 'Sure, I\'ll remind you to ' + message.match[1].replace('me', 'you') +  ' at ' + message.match[2]);
});

module.exports.receiveConvo = function (convoObject) {
  console.log(authMessage);
  bot.startPrivateConversation(authMessage, function (err, convo) {
    convo.say('Here\'s a survey your coach wanted me to send you:');
    for (var i = 0; i < convoObject.questions.length; i++) {
      convo.ask(convoObject.questions[i], function (res, convo) {
        console.log(res.text);
        setTimeout(function () {
          convo.next();
        }, 2000);
      });
    }
    convo.say('Thanks for answering my questions. Enjoy the rest of your day!');
    convo.on('end', function (convo) {
      if (convo.status == 'completed') {
        var responses = convo.extractResponses();

        var responseArray = [];
        // In order to send responses back as an array in the right order, loop through questions array
        for (var i = 0; i < convoObject.questions.length; i++) {
          var question = convoObject.questions[i];
          // Responses are indexed by the question as a key
          var response = responses[question];
          // Push the response onto the responseArray
          responseArray.push(response);
        }
        console.log(convo);
        console.log(responseArray);
      }
    });
  });
};

function trySendingSurvey () {
  if (typeof authMessage !== 'undefined') {
    clearInterval(interval);
    module.exports.receiveConvo(ConvoObjects[0]);
  }
}

var interval = setInterval(trySendingSurvey, 10000);
