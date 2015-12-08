/* Uses the slack button feature to offer incoming webhooks to multiple teams */
var Botkit = require('../Botkit.js');

if (!process.env.clientId || !process.env.clientSecret || !process.env.port) {
  console.log('Error: Specify clientId clientSecret and port in environment');
  process.exit(1);
}

var controller = Botkit.slackbot({
  json_file_store: './db_slackbutton_incomingwebhook/',
}).configureSlackApp(
  {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['incoming-webhook'],
  }
);


controller.setupWebserver(process.env.port,function(err,webserver) {


  webserver.get('/',function(req,res) {

    var html = '<h1>Super Insecure Form</h1><p>Put text below and hit send - it will be sent to every team who has added your integration.</p><form method="post" action="/unsafe_endpoint"><input type="text" name="text" /><input type="submit"/></form>';
    res.send(html);

  });

  // This is a completely insecure form which would enable
  // anyone on the internet who found your node app to
  // broadcast to all teams who have added your integration.
  // it is included for demonstration purposes only!!!
  webserver.post('/unsafe_endpoint',function(req,res) {
    var text = req.body.text;
    text = text.trim();

    controller.storage.teams.all(function(err,teams) {
      var count = 0;
      for (var t in teams) {
        if (teams[t].incoming_webhook) {
          count++;
          controller.spawn(teams[t]).sendWebhook({
            text: text
          },function(err) {
            if(err) {
              console.log(err);
            }
          });
        }
      }

      res.send('Message sent to ' + count + ' teams!')
    })
  });

  controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});


controller.on('create_incoming_webhook',function(bot,webhook_config) {
  bot.sendWebhook({
    text: ':thumbsup: Incoming webhook successfully configured'
  });
})
