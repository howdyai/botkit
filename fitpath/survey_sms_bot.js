var Botkit = require('../lib/Botkit.js');
var serverIp = require('./env.js').serverIp;
var request = require('request');

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


var controller = Botkit.twiliosmsbot({
  account_sid: 'ACf83693e222a7ade08080159c4871c9e3',
  auth_token: '20b36bd42a33cd249e0079a6a1e8e0dd',
  twilio_number: '+12044005478'
});

var bot = controller.spawn({});

controller.setupWebserver(3000, function (err, webserver) {
  controller.createWebhookEndpoints(controller.webserver, bot, function () {
    console.log('TwilioSMSBot is online!');
  });
});

// bot.startConversation({channel: '+15064706220', user: '+15064706220', text: ''}, function (err, convo) {
//     convo.say('Hello!');
//     convo.ask('What is your name?', function (res, convo) {
//       convo.say(`Nice to meet you, ${res.text}!`);
//       console.log(res.text);
//       convo.next();
//     });
// });

controller.hears('.*', 'message_received', function (bot, message) {
  bot.reply(message, 'Sorry, my programmer was too lazy to come up with a response for that.');
});


module.exports.receiveConvo = function (convoObject) {
  console.log('received convo');
  console.log(JSON.stringify(convoObject));
  bot.startPrivateConversation({user: convoObject.userContactInfo.phoneNumber, text: ''}, function (err, convo) {
    convo.say('Hi! Here\'s a survey your coach wanted me to send you.');
    for (var i = 0; i < convoObject.questions.length; i++) {
      console.log(convoObject.questions[i].question);
      convo.ask(convoObject.questions[i].question, function (res, convo) {
        console.log(res.text);
        convo.next();
      });
    }
    convo.say('Thanks for answering my questions. Enjoy the rest of your day ' + String.fromCodePoint(128578));
    convo.on('end', function (convo) {
      if (convo.status == 'completed') {
        console.log();
        console.log('ended');
        console.log();
        var responses = convo.extractResponses();
        console.log('Responses: ' + responses);

        var responseArray = [];
        // In order to send responses back as an array in the right order, loop through questions array
        var response = {};
        response.assignment = convoObject.assignmentId;
        response.userId = convoObject.userId;
        response.surveyTemplateId = convoObject.surveyId;
        response.questions = [];
        for (var i = 0; i < convoObject.questions.length; i++) {
          var question = convoObject.questions[i].question;
          console.log('Question: ' + question);
          // Responses are indexed by the question as a key
          console.log('Response: ' + response);
          // Push the response onto the responseArray
          //responseArray.push(response);
          response.questions[i] = convoObject.questions[i];
          response.questions[i].answer = responses[question];
        }
        request.post({url: 'http://' + serverIp + ':12557/api/response/create', json: true, body: response}, function (err, response, body) {
          console.log(err);
          console.log(response);
          console.log(body);
        });
      }
    })
  });
};

/*for (var i = 0; i < ConvoObjects.length; i++) {
  var ConvoObject = ConvoObjects[i];
  module.exports.receiveConvo(ConvoObject);
}*/
