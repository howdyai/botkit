var request = require('request');
var _ = require('underscore');
var Promise = require('bluebird');
var request = require('request');

function Reminder(bot) {

  return {
    sendToSlack: sendToSlack,
    get: get,
    format: format,
    sendBackResponse: sendBackResponse
  }

  // Load
  function sendToSlack() {

  }

  function startConvo(message) {
    bot.startPrivateConversation({user: message.user}, function(response, convo) {
      convo.ask
    })
  }

  // Bot -> Express Endpoint
  function getOutgoing() {



  }

  function get() {
    return new Promise(function(resolve, reject) {
      request.get('http://localhost:3000/api/reminder/now', function(err, res, body){
        var outgoing = [];
        if(body) {
          var reminders = JSON.parse(body);
          _.each(reminders, function(reminder) {
            var reminder = {
              // Used to ref dashboard reminder object
              id: reminder._id,
              //message: format(reminder.title, reminder.assignee.slack.id),
              message: reminder.title,
              user: reminder.assignee.slack.id
            }
            outgoing.push(reminder);
          });
          resolve(outgoing)
        }
        else {
          reject(err);
        }
      });
    });
  }

    // var options = {
    //   method: 'GET',
    //   uri: 'http://localhost:3000/api/reminder/now',
    //   json: true
    // }
    // var outgoing = [];

    // rp(options)
    //   .then(function(reminders) {
    //     if(reminders.length > 0) {
    //       _.each(reminders, function(reminder) {
    //           var reminder = {
    //             message: format(reminder.title, reminder.assignee.slack.id),
    //             user: reminder.assignee.slack.id
    //           }
    //           outgoing.push(reminder);
    //         });
    //         console.log(outgoing);
    //         return outgoing;
    //       }
    //   })
    //   .catch(function(err) {
    //     console.log(err);
    //   });

  // Send reminder text in an attractive manner
  function format(action, user) {
    var message = {
      'username': 'willow',
      'attachments': [
        {
          'fallback': 'You have a reminder!',
          'title': 'Reminder:',
          'text': 'Hey' + '<@'+ user + '> ' + 'did you ' + action,
          'color': '#81C784',
        }
      ],
      //'icon_url': './willow.png',
      'mrkdwn': true
    }
    return message;
  }

  // Slack -> Dashboard
  function sendBackResponse(response, id) {
    return new Promise(function(resolve, reject) {
      request.post('http://localhost:3000/api/reminder/response/' + id,
      {
        form: {
          contents: response
        }
      },
      function(err, res, body) {
        console.log(body);
      });
    });
  }
}

module.exports = Reminder;
