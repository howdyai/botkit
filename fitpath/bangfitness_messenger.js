'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');

var app = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(express.static('bangfitnesspublic'));

app.get('/webhook', function (req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === 'FISH_TACOS') {
    console.log('Validating webhook');
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error('Failed validation. Make sure the validation tokens match.');
    res.sendStatus(403);
  }
});

app.post('/webhook', function (req, res) {
  var data = req.body;

  if (data.object == 'page') {
    data.entry.forEach(function (entry) {
      entry.messaging.forEach(function (messagingEvent) {
        if (messagingEvent.optin) {
          sendWelcomeMessage(messagingEvent.sender.id);
          // The user clicked the 'Send to Messenger' button
        } else if (messagingEvent.message) {
          // The user sent a message to the bot.
          receivedMessage(messagingEvent);
        }
      });
    });
  }

  res.sendStatus(200);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

function sendWelcomeMessage (recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Hi, welcome to Bang Fitness. What kind of help would you like?",
      quick_replies: [
        {
          content_type: "text",
          title: "Workouts",
          payload: "WORKOUTS"
        },
        {
          content_type: "text",
          title: "Nutrition",
          payload: "NUTRITION"
        }
      ]
    }
  };

  callSendAPI(messageData);
}

function callSendAPI (messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.7/me/messages',
    qs: { access_token: 'EAAD0LsmI8VABAAw6pbZC3ubec2vPnNKQwYNbcG915lPWIkWaGYZBw7wVeFcLklJIA0WYnfiEtKE0VN03syVTRBqWVBVmNQbkZAh2m095xK2zg7Pf9q1gBRONzvoSSSwZCraW2EhPPcQZAzhVLdrvtBeETezmwc9dzlSsZCEzPfZAAZDZD'},
    method: 'POST',
    json: messageData
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log('Success');
    } else {
      console.error('Unable to send message.');
      console.error(response);
      console.error(error);
    }
  });
}

function receivedMessage (event) {
  var senderId = event.sender.id;
  var messageText = event.message.text;

  if (messageText) {
    if (messageText === 'Workouts') {
      sendTextMessage(senderId, 'Try doing 25 pushups every morning for the next week.');
    } else {
      sendTextMessage(senderId, 'Try eating less potato chips after 6pm.');
    }
  } else {
    sendTextMessage(senderId, 'I\'m sorry, but I\'m not sure what you mean.')
  }
}

function sendTextMessage (recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}
