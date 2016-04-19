var request = require('request');
var _ = require('underscore');

function Reminder(bot) {

  return {
    sendToSlack: sendToSlack,
    getOutgoing: getOutgoing,
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
    var outgoing = [];
    request.get('http://localhost:3000/api/reminder/now',
    function(err, response, body) {
      var reminders = JSON.parse(body);
      if(reminders.length > 0) {
        _.each(reminders, function(reminder) {
          var reminder = {
            message: reminder.title,
            user: reminder.assignee.slack.id
          }
          outgoing.push(reminder);
        });
      }
    });
    return outgoing;
  }

  // Send reminder text in an attractive manner
  function format(reminder) {
    var message = {
      'username': 'willow',
      'attachments': [
        {
          'fallback': 'You have a reminder!',
          'title': 'Reminder:',
          'text': 'Hey' + '<@'+ reminder.user + '> ' + 'did you ' + reminder.message,
          'color': '#81C784',
        }
      ],
      //'icon_url': './willow.png',
      'mrkdwn': true
    }
    return message;
  }

  // Slack -> Dashboard
  function sendBackResponse(response) {

  }
}

module.exports = Reminder;
