var Botkit = require('../../lib/Botkit.js');

var controller = Botkit.slackbot({
    debug: true
});


controller.setupWebserver(3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver);
});

controller.on('outgoing_webhook', function(bot, message) {

    bot.replyPublic(message, 'This is a public reply to the outgoing webhook!');

});
