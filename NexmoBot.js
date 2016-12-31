var Botkit = require(__dirname + '/CoreBot.js');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');

function NexmoBot(configuration) {

    var nexmo_botkit = Botkit(configuration || {});

    return nexmo_botkit;
};

module.exports = NexmoBot;
