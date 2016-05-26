var Botkit = require('../lib/Botkit.js');
var _ = require('underscore');
var moment = require('moment');
var request = require('request');
var rp = require('request-promise');
var usersSlack = [];
// var checkIn = 'Thursday';
//var token ='xoxp-21143396339-21148553634-24144454581-f6d7e3347d';

var recipients = [

                    'U1457G26Q'

]

var reminder = {"_id":"57150d7579252b2e9cc3bc2b", "title": "Drink Lots Of water"};

var controller = Botkit.slackbot({
  json_file_store: '../db/',
  debug: false
  //include "log: false" to disable logging
  //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

// connect the bot to a stream of messages
var bot = controller.spawn({
  token: 'xoxb-29530029556-OmwcgKzhVDUHSa4x85eRRpba',
  json_file_store: '../db/'
}).startRTM()
controller.storage.users.all(function(err, all_user_data){});

controller.hears('sendweeklysurvey', ['direct_message'], function(bot, message) {
  init();
});
controller.hears('fire it up', ['direct_message'], function(bot, message) {
  //init the bot so it has the stuff to do what it needs to do
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
        console.log('User has %d repos', repos.length);
        usersSlack = repos.members;
        startQuery();


    })
    .catch(function (err) {
        // API call failed...
    });

});

startQuery = function(){
  var d = new Date();
  var t = d.getTime();
  var timeout = 60000 - t % 60000;
  setTimeout(
    function(){
      setInterval(
        function(){
          console.log('asked server');
          askServer()
        }, 60000)
      }
      ,  timeout);
};
askServer = function() {
  var remindersJSON;
  var reminders  = [];
  var user_id = "sad face";
  console.log('asked sever');

  request('http://localhost:8081/api/reminder/now', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log('request - reminder/now');
        remindersJSON = JSON.parse(body);
        console.log(remindersJSON);
          //     Show the HTML for the Google homepage.
        var blankArray = [];
        console.log(blankArray !== []);

        if(Array.isArray(remindersJSON) && remindersJSON !== [] && remindersJSON.length >0 ){
          console.log(remindersJSON);
          for(var i = 0; i<remindersJSON.length; i++){
            //make the array of the shit we need
            if(remindersJSON[i].hasOwnProperty('assignee') && remindersJSON[i].hasOwnProperty('title')){
              user_id = getUserId(remindersJSON[i].assignee.username);
              var reminder = {id: remindersJSON[i]._id, title: remindersJSON[i].title, user: user_id};
              // reminderContent[i][0] = remindersJSON[i].title;
              // reminderContent[i][1] = getUserId(remindersJSON[i].assignee.username);

              reminders.push(reminder);
              sendReminders(reminder);
              console.log('the remidner =========');
              console.log(reminder);
              //s    hould turn this into a for loop and interate thru to make the
              //console.log(getUserId(remindersJSON[0].assignee.username));
            };
          };
        };
      }});
};








getUserId = function(email){
    //bit of a hack bc I can't figure out mongoose joins and I just wanna get it working and not wait for colin to wake up :)
    var members = usersSlack;
    var user_id = "userId failed";
    console.log("method called" + email);

    //console.log(body);
    //console.log("gigity");
    //usersJSON = JSON.parse(body);


    for (var i = 0; i<members.length; i++){
      console.log(members[i].profile.email);
      if(email === members[i].profile.email){
          console.log('MATCH ');
          console.log(members[i].id);
          user_id = members[i].id;

        };

      };
      return user_id;





};





initiateReminders = function(remindersJSON){
    //iterate thru list
    getUserId();
    //something like this
     _.each(remindersJSON, function(assignee) {
    // init convo function
        getUserId();
        console.log('the asignee ===============');
        console.log(assingee);
        sendReminders(assignee);
    });
};

sendReminders = function(reminder){
    //then fire a private convo for each
    //console.log(assignee.slack_id);
    bot.startPrivateConversation({user: reminder.user}, function(response, convo){
      convo.ask("Hey, " + '<@' + convo.source_message.user + '> ' +  " it's time for your daily check-in. Did you  " + reminder.title + " today ? ", function(response, convo) {
          //controller.storage.users.save({id: response.user, overall: response.text}, function(err){});

          convo.next();
      }, {key:"intro"});

      convo.on('end', function (convo) {
          if(convo.status == 'completed') {
            var postData = convo.extractResponses();
            console.log(postData);
            //postResponses(postData);
            //console.log(response.user + ' ' + convo.startTime);
            console.log('===========================');
            console.log(reminder);

            request.post('http://localhost:8081/api/reminder/response/' + reminder.id,
            {
              form: {
                contents: postData
              }
            },
            function(err, response, body){
              if(err) {
                console.log(err);
              }
              else {
                console.log(body);
              }
            });
        }
       });
    });



};




controller.hears('post', ['direct_message'], function(bot, message){
  console.log("Test: 1");
  request.post('http://159.203.40.24:8081/willow/survey',{
    form: {
      responses : {
        init: 'yes',
        mood: 't',
        sleep: 'r',
        anxiety: '3',
        self_care: '2',
        questions: '1'
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

});
// init();
postResponses = function(postData) {
  console.log(postData.init);
  request.post('http://159.203.40.24:8081/willow/survey',{
      form: {
        responses : {
          init: postData.init,
          mood: postData.mood,
          sleep: postData.sleep,
          anxiety: postData.anxiety,
          self_care: postData.self_care,
          questions: postData.questions
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

//TODO do up a get request from the server

//initially just do it to pull a user from the

controller.hears('response-server', ['direct_message'], function(bot, message) {
  bot.startPrivateConversation(message, function(response, convo) {
    convo.ask("Did you "  + reminder.title, function(err, convo) {
      convo.next();

    },{key: reminder.title});

    convo.on('end', function (convo) {
        if(convo.status == 'completed') {
          var postData = convo.extractResponses();
          console.log(postData);
          //postResponses(postData);
          //console.log(response.user + ' ' + convo.startTime);
      }
     });

  });
});

function reminderResponseSave(reminder) {


}




askOverall = function(response, convo) {
     //get user name
 // convo.sayFirst("Hi," + " I'm Willow");


  convo.ask("Hey, " + '<@' + convo.source_message.user + '> ' +  ", I was wondering if we could do your daily wellness survey now ? ", function(response, convo) {
    //controller.storage.users.save({id: response.user, overall: response.text}, function(err){});

    askFirst(response, convo);
    convo.next();
  }, {key:""});


}

askFirst = function(response, convo) {
  convo.ask("Rate your overall mood on a scale from 1 - 5", function(response, convo) {
    //TODO confirm that is't


    convo.say("Ok.")

    askSecond(response, convo);
    convo.next();
  }, {key:"mood"});
}

askSecond = function(response, convo) {
  convo.ask("How was your sleep last night (1-5)", function(response, convo) {
    convo.say("Ok! ");
    askThird(response, convo);
    convo.next();
  }, {key:"sleep"});
}


askThird = function (response, convo) {
  convo.ask("How has your anxiety been (1-5)", function(response, convo) {
    askFourth(response, convo);
    convo.next();
  }, {key: "anxiety"});
}

askFourth = function(response, convo) {
  convo.ask("on a scale of `1-5 how well have you been doing with self care", function(response, convo) {
    askFifth(response, convo);
    convo.next();
  }, {key:"self-care"});
}

askFifth = function(response, convo) {
  convo.ask("Do you have any questions or comments you want to forward to Thom?", function(response, convo) {
    convo.say("All done, Thanks! Remember to drink your water! ");
      console.log(convo.id);
       //controller.storage.users.save({id: 12, overall: convo}, function(err){});
    convo.next();
  }, {key:"questions"});

  convo.on('end', function (convo) {
      if(convo.status == 'completed') {
        var postData = convo.extractResponses();
        postResponses(postData);
        console.log(response.user + ' ' + convo.startTime);


        // controller.storage.channels.save({id: response.user + ' ' + convo.startTime, overall: res}, function(err){
        //   console.log("didn't work");
        // });

          // var options = {
          //   hostname: '159.203.40.24',
          //   port: 8081,
          //   path: '/willow/survey',
          //   method: 'POST',
          //   headers: {
          //     'Content-Type': 'application/x-www-form-urlencoded',
          //     'Content-Length': postData.length
          //   }
          // };
          //
          // var req = http.request(options, (res) => {
          //   console.log(`STATUS: ${res.statusCode}`);
          //   console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
          //   res.setEncoding('utf8');
          //   res.on('data', (chunk) => {
          //     console.log(`BODY: ${chunk}`);
          //   });
          //   res.on('end', () => {
          //     console.log('No more data in response.')
          //   })
          // });
          //
          // req.on('error', (e) => {
          //   console.log(`problem with request: ${e.message}`);
          // });
          //
          // // write data to request body
          // req.write(postData);
          // req.end();



      }
   });

}

// function users(response) {

//    var list = _.filter(response.members, function(member) {
//        return member.is_bot == false && member.id != 'USLACKBOT';
//    })
//    var ids =  _.pluck(list, "id");

//    return ids;

// }

function sendResponses(response, id){
  var responses = surveyResponseToString(response);
  console.log('sned Responses');
  var attachments = {
    'username': 'survey',
    'channel': 'C0NGETH71',
    'attachments': [
      {
        'text': responses,
        'color': '#81C784',
        'title': '<@' + id + '>' + ' has completed their weekly survey!',
        'fallback': '<@' + id + '>' + ' has completed their weekly survey!',
        'mrkdwn_in' : [
          'text',
          'title',
          'fallback'
        ]
      }
    ],
    'icon_url': 'https://i.imgsafe.org/1b33b2f.png'
  }
  console.log(attachments);
  bot.say(attachments);
}


function initWeeklySurvey() {
    console.log('init surbey');
  _.each(recipients, function(id) {
    // init convo function
    sendSurvey(id);

  }, recipients);

}

function sendSurvey(id) {
  console.log('sendSurvey');
  bot.startPrivateConversation({user: id}, function(response, convo) {
    askOverall(response, convo);
    convo.next();
  });
}

function dayCheck() {
  console.log('dayCheck');
  var current = moment().format('dddd');
  if (current == checkIn) {
    initWeeklySurvey();
  }
}
// Checks every 1 hour
function init() {
  // console.log('init');
  // setInterval(
  //   function() {
  //     dayCheck();
  //   },
  //   60 * 1000
  // );

  initWeeklySurvey();
}
// convo.source_message.user

function surveyResponseToString(surveyObj) {

  var result = _.reduce(surveyObj, function(output, item, key, surveyObj) {
    if (key === Object.keys(surveyObj)[1]) {
     output = "*" + Object.keys(surveyObj)[0] + "*: " + output + "\n";
    }
    return output + "*" + key + "*: " + item + "\n";

  });
  return result;

}
