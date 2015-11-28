var Botkit = require('./Botkit.js');

var controller = Botkit.slackbot({
  json_file_store: './db/',
});

// controller.storage.users.all(function(err,users) {
//   if (err) {
//     console.log(err);
//   }
//   for (var u in users) {
//     controller.spawn({token: users[u].access_token}).api.auth.test({},function(err,auth) {
//       console.log(err,auth);
//     })
//   }
// })


controller.storage.teams.all(function(err,teams) {
  if (err) {
    console.log(err);
  }
  try {
    for (var t in teams) {
      var bot = controller.spawn().
        configureIncomingWebhook(teams[t].incoming_webhook).
        sendWebhook({
          text: 'Test message',
        })
    }
  } catch(err) {
    console.log(err);
  }
})
