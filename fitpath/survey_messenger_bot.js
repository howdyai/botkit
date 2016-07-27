var Botkit = require('../lib/Botkit.js');
var mongoose = require('mongoose');
var RiveScript = require('rivescript');
var schedule = require('node-schedule');

function parseTime(timeStr, dt) {
    if (!dt) {
        dt = new Date();
    }

    var time = timeStr.match(/(\d+)(?::(\d\d))?\s*(p?)/i);
    if (!time) {
        return NaN;
    }
    var hours = parseInt(time[1], 10);
    if (hours == 12 && !time[3]) {
        hours = 0;
    }
    else {
        hours += (hours < 12 && time[3]) ? 12 : 0;
    }

    dt.setHours(hours);
    dt.setMinutes(parseInt(time[2], 10) || 0);
    dt.setSeconds(0, 0);
    return dt;
}

mongoose.connect('mongodb://shane:letmein1@localhost/development');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('Connected to db');
});

var messageSchema = mongoose.Schema({
  sentBy: String,
  sentTo: String,
  text: String
});

var Message = mongoose.model('Message', messageSchema);

var reminderSchema = mongoose.Schema({
  hour: Number,
  minute: Number,
  text: String,
  originalMessage: Object
});

var Reminder = mongoose.model('Reminder', reminderSchema);

var rivescript = new RiveScript();

var controller = Botkit.facebookbot({
  access_token: 'EAADXmpOGmZBQBAEtfcPjsGZCo5kYkptvjjZBOF3jcFPOEggsw25p6FRZBLyc5tZAlWQpj6C6fnR0nbSEzLgdCHxrQ8M57AN7pS8NzcR1ZAAwdzZBFD72lLPhRFOxB1ZAARZBrAZANBtQDNKejd9OtjjRBgkPtP7ZCUZBN4ywfEZAxuCRlogZDZD',
  verify_token: 'FISHTACOS',
});

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
    console.log('Loading brain...');
    rivescript.loadDirectory(__dirname + '/brain', function () {
      console.log('FitBot Messenger is online!');
    }, function (error) {
      console.log('Error when loading files: ' + error);
    });
  });
});

controller.on('facebook_optin', function (bot, message) {
  authMessage = message;
  console.log(authMessage);
});

controller.hears('survey', 'message_received', function (bot, message) {
  bot.reply(message, 'Hi! I\'ll be sending a survey to you shortly.');
  authMessage = message;
  console.log(message);
});

controller.hears('remind me to (.*) at (.*)', 'message_received', function (bot, message) {
  bot.reply(message, 'Sure, I\'ll remind you to ' + message.match[1].replace('me', 'you').replace('my', 'your') +  ' at ' + message.match[2]) + '.';
  console.log(message.match[2]);
  console.log(parseTime(message.match[2]));
  Reminder.create({
    hour: parseTime(message.match[2]).getHours(),
    minute: parseTime(message.match[2]).getMinutes(),
    text: message.match[1].replace('me', 'you').replace('my', 'your'),
    originalMessage: message
  }, function (err, reminder) {
    if (err) console.log(err)
    console.log(reminder);
  });
});

controller.on('message_received', function (bot, message) {
  // Create message document representing the message that the user sent the bot
  // TODO: use actual values for sentTo and sentBy
  // TODO: add error checking
  Message.create({
    sentTo: 'Bot',
    sentBy: message.user,
    text: message.text
  });

  console.log(message.text);

  // If the other actions wouldn't be triggered
  if (!message.text.includes('survey')    &&
      message.text.search(/remind me to (.*) at (.*)/) === -1) {
    console.log(message.text);
    rivescript.sortReplies();
    var reply = rivescript.reply('local-user', message.text);
    console.log(reply);
    bot.reply(message, reply);

    // Create message document representing the message that the bot sent the user
    // TODO: same as above
    Message.create({
      sentTo: message.user,
      sentBy: 'Bot',
      text: reply
    });
  }
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
    module.exports.receiveConvo(ConvoObjects[0]);
    authMessage = undefined;
  }
}

var interval = setInterval(trySendingSurvey, 10000);

function trySendingReminders () {
  console.log(new Date().getHours());
  console.log(new Date().getMinutes());
  console.log('Trying to send reminders...')
  Reminder.find({hour: new Date().getHours(), minute: new Date().getMinutes()}, function (err, reminders) {
    for (var i = 0; i < reminders.length; i++) {
      console.log(reminders[i]);
      var message = reminders[i].originalMessage;
      message.text = 'Hey! You wanted me to remind you to ' + reminders[i].text + '.';
      bot.say(message);
    }
  });
}

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [new schedule.Range(0, 6)];
schedule.scheduleJob(rule, function () {
  trySendingReminders();
});
