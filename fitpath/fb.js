var Botkit = require('../lib/Botkit.js');
var moment = require('moment');
var _ = require('underscore');
var request = require('request');
var rp = require('request-promise');
var db = require('../lib/storage/simple_storage.js');

var responses = [];
var users = [];
var clients_id = [];
var clients_name = [];

var controller = Botkit.Facebookbot({
  json_file_store: '../db/',
  debug: false
  //include "log: false" to disable logging
  //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

// connect the bot to a stream of messages
var bot = controller.spawn({
  token: 'xoxb-37920661316-Umfkqk2AxA5glTiQS4vMqNdT',//josh_bot token
  json_file_store: '../db/'
}).startRTM()

/*
 Activing the survey
*/
controller.hears(['b4c-weekly-survey'],['direct_message'],function(bot,message) {
  console.log("Get Users");
  var options = {
    uri: 'https://slack.com/api/users.list',
    qs: {
        token: 'xoxp-21143396339-21146377714-22731192086-16bf020b08', // -> uri + '?access_token=xxxxx%20xxxxx'
        pretty: 1
    },
    headers: {
        'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
  };

  rp(options)
    .then(function (repos) {
        users = repos.members;
        //console.log(users);

        /*
          Sorting out the bots and putting id's and name's in two different arrays
        */
        for(i = 0; i< users.length; i++){
          if(users[i].is_bot || users[i].name === 'slackbot'){
            //kick the bots out of the array
          }
          else{
            clients_id.push(users[i].id);
            clients_name.push(users[i].name);
          }
        }

        //console.log(clients_id);
        //console.log(clients_name);

        /*
          Comment this out when using every user in team
        */
        clients_id = [
          //'U0M49UJ4V', //Matt
          //'U0M4AB3M0', //Thom
          //'U0S68V5PX', //jo
          'U1457G26Q' //josh_tester
        ];

        console.log("Start Conversations");
        _.each(clients_id, function(id) {
          // init convo function
          sendSurvey(id);

        }, clients_id);

    })
    .catch(function (err) {
        // API call failed...
    });
});
