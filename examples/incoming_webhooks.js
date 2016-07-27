/* TODO bot that demonstrates sending incmoing webhooks to one specific team */

var express = require('express');
var request = require('request');

var app = express();

app.get('/webhook', function (req, res) {
  if (req.query['hub.verify_token'] === 'password') {
    res.send(req.query['hub.challenge']);
  } else {
    res.send('Error, wrong validation token');
  }
});
