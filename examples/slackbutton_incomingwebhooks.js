/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/
            

This is a sample Slack Button application that allows the application
to post messages into Slack.

This bot demonstrates many of the core features of Botkit:

* Authenticate users with Slack using OAuth
* Receive messages using the slash_command event
* Reply to Slash command both publicly and privately

# RUN THE APP:

  Create a Slack app. Make sure to configure at least one Slash command!

    -> https://api.slack.com/applications/new

  Run your bot from the command line:

    clientId=<my client id> clientSecret=<my client secret> port=3000 node bot.js

# USE THE APP

  Add the app to your Slack by visiting the login page:

    -> http://localhost:3000/login

  After you've added the app, send a message using the SUPER INSECURE FORM.
  This form is included as an example only, and should definitely not be
  left in place if you use this code to start your own project.

  Send a message to every team who has added your sample app:

    -> http://localhost:3000/


# EXTEND THE APP:

  Botkit is has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
var Botkit = require('../lib/Botkit.js');

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

      res.send('Message sent to ' + count + ' teams!');
    });
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
