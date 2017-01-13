if (!process.env.api_key) {
    console.log('Error: Specify api_key in environment');
    process.exit(1);
}

if (!process.env.api_secret) {
    console.log('Error: Specify api_secret in environment');
    process.exit(1);
}

if (!process.env.bot_number) {
    console.log('Error: Specify bot_number in environment');
    process.exit(1);
}

var Botkit = require('./lib/Botkit.js');

var controller = Botkit.nexmobot({
    debug: true,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret,
    bot_number: process.env.bot_number,
});

var bot = controller.spawn({});

controller.setupWebserver(process.env.port || 3000, function (err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function () {
        console.log('*** Beep Boop ... i\'m online :)');
    });
});

controller.hears(['hi'], 'message_received', function (bot, message) {
    bot.reply(message, 'Hey! very happy to hear from you');
});

controller.hears(['cookies'], 'message_received', function (bot, message) {
    bot.startConversation(message, function(err, convo) {
        convo.say('Did someone say cookies!?!!');
    })
});
