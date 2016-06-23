var Botkit = require('../lib/Botkit.js');

var ConvoObject = {
  userId: '5754345drt4654353',
  userMedium: 'sms',
  userContactInfo: {name: 'Josh', phoneNumber: '+15064706220'},
  questions: [
    'Do you like pancakes?',
    'Do you like waffles?',
    'Do you like french toast?'
  ],
  surveyId: '35435436afaf'
};

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

// Currently broken
/*controller.hears('.*', 'message_received', function (bot, message) {
  bot.reply(message, 'Sorry, my programmer was too lazy to come up with a response for that.');
});
*/

module.exports = function receiveConvo(convoObject) {
  console.log(JSON.stringify(convoObject));
  bot.startConversation({channel: convoObject.userContactInfo.phoneNumber, user: convoObject.userContactInfo.phoneNumber, text: ''}, function (err, convo) {
    for (var i = 0; i < convoObject.questions.length; i++) {
      convo.ask(convoObject.questions[i], function (res, convo) {
        console.log(res.text);
        convo.next();
      });
    }
  });
};
