var Botkit = require('../lib/Botkit.js');
var moment = require('moment');
var responses = [];
var _ = require('underscore');
var index = 0;
var dndStatus = [];
var production = false;
var users = [];
var clients_id = [];
var clients_name = [];
var request = require('request');
var rp = require('request-promise');
var db = require('../lib/storage/simple_storage.js');

//set this flag to a process.env.debug flag prob
if (!process.env.token) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}
var controller = Botkit.slackbot({
    json_file_store: './db_slackbutton_incomingwebhook/',
 debug: false
});
controller.spawn({
  token: process.env.token
}).startRTM(function(err) {
  if (err) {
    throw new Error(err);
  }
});


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
        clients_id = [
          //'T0M47BN9Z', //Matt
          'U0M4AB3M0', //Thom
          'U0S68V5PX', //jo
          'U1457G26Q' //josh_tester
        ];
        //sendSurvey(coachClientsID, bot)
        /*
        bot.startPrivateConversation({user: clients_id[14]}, function(response, convo) {
          name(response, convo);
          convo.next();
        });
        */
        console.log("Start Conversations");
        _.each(clients_id, function(id) {
          // init convo function
          sendSurvey(id, bot);

        }, clients_id);

    })
    .catch(function (err) {
        // API call failed...
    });
});

function sendSurvey(id, bot){
      console.log(id)
      console.log("Have to sendSurvey!");
      bot.startPrivateConversation({user: id}, function(response, convo) {
      console.log("Conversation Started!");
      start(response, convo);
      convo.next();
    });

  }

start = function(response, convo) {
  convo.ask("Hey, " + '<@' + convo.source_message.user + '> ' +  "time for your weekly survey!", function(response, convo){
    week(response, convo);
    convo.next();
  }, {key: "start"});
}

week = function(response, convo) {
  convo.ask("What week are you evaluating?(1-6)", function(response, convo) {

    rate(response, convo);
    convo.next();
  }, {key:"week"});
}

rate = function(response, convo) {
  convo.ask("Please rate the overall content for this week?(1-6)", function(response, convo) {

    speaker(response, convo);
    convo.next();
  }, {key:"rate"});
}

speaker = function(response, convo) {
  convo.ask("Please tell me which speakers/activities you preferred and why?", function(response, convo) {

    mean(response, convo);
    convo.next();
  }, {key: "speaker"});
}

mean = function(response, convo) {
  convo.ask("Was the content meaningful and relevant?", function(response, convo) {

    topic(response, convo);
    convo.next();
  }, {key:"mean"});
}

topic = function(response, convo) {
  convo.ask("Are the things you would have liked to have seen incorporated into the programming that is relevant to the topic of the week?", function(response, convo) {

    time(response, convo);
    convo.next();
  }, {key:"topic"});
}

time = function(response, convo) {
  convo.ask("Did you have enough time to work throughout the sessions?", function(response, convo) {

    comments(response, convo);
    convo.next();
  }, {key:"time"});
}

comments = function(response, convo) {
  convo.ask("Any other comments/questions/concerns?", function(response, convo) {

    convo.ask("Thank You for doing your weekly survey!");
    var responses = convo.extractResponses();
    console.log(responses);
    console.log("here");
    convo.next();
    closeSurvey(response, convo);
  }, {key:"comments"});
}

closeSurvey = function(response, convo) {
  convo.on('end', function (convo) {
      console.log("Hi");



      if(convo.status == 'completed') {
        var res = convo.extractResponses();
        var user = convo.source_message.user;
        console.log(user);
        console.log(res);

        // console.log(convo);
        postResponses(res);

      }
      else {
        console.log("Error");
    // something happened that caused the conversation to stop prematurely
      }
});
}

postResponses = function(postData) {
  console.log("Im here");
  request.post('http://159.203.40.24:3000/willow/survey',{
      form: {
        responses : {
          week: postData.week,
          rate: postData.rate,
          speaker: postData.speaker,
          mean: postData.mean,
          topic: postData.topic,
          time: postData.time,
          comments: postData.comments
        }
      }
      },function(err,httpResponse,body){
      if(err) {
        //console.log(err);
      }
      else {
        console.log(body);
      }
    });
};






parseTimeStamp = function(time) {
    var when = moment.unix(time);
    return moment(when).fromNow();
}
//method to query which users
//reflect answers
//store in a json
//send the info to keystone
