var Botkit = require('../lib/Botkit.js');
var mongoose = require('mongoose');
var RiveScript = require('rivescript');

mongoose.connect('mongodb://shane:letmein1@localhost/development');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('Connected to db');
});

var messageSchema = mongoose.Schema({
  sentBy: String,
  sentTo: String,
  text: String
});

var Message = mongoose.model('Message', messageSchema);

var rivescript = new RiveScript();

var controller = Botkit.facebookbot({
  access_token: 'EAADXmpOGmZBQBAEtfcPjsGZCo5kYkptvjjZBOF3jcFPOEggsw25p6FRZBLyc5tZAlWQpj6C6fnR0nbSEzLgdCHxrQ8M57AN7pS8NzcR1ZAAwdzZBFD72lLPhRFOxB1ZAARZBrAZANBtQDNKejd9OtjjRBgkPtP7ZCUZBN4ywfEZAxuCRlogZDZD',
  verify_token: 'FISHTACOS',
});

var bot = controller.spawn({});

controller.setupWebserver(27182, function (err, webserver) {
  controller.createWebhookEndpoints(controller.webserver, bot, function () {
    console.log('Loading brain...');
    rivescript.loadDirectory(__dirname + '/brain', function () {
      console.log('FitBot Messenger is online!')
    }, function(error) {
      console.log('Error when loading files: ' + error);
    });
  });
});

controller.on('message_received', function (bot, message) {
  // Create message document representing the message that the user sent the bot
  // TODO: use actual values for sentTo and sentBy
  // TODO: add error checking
  Message.create({
    sentTo: 'Bot',
    sentBy: message.user,
    text: message.text
  });

  rivescript.sortReplies();
  var reply = rivescript.reply('local-user', message.text);
  bot.reply(message, reply);

  // Create message document representing the message that the bot sent the user
  // TODO: same as above
  Message.create({
    sentTo: message.user,
    sentBy: 'Bot',
    text: reply
  });
});
