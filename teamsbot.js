
var Botkit = require('./lib/Botkit.js');
var os = require('os');
var request = require('request');

var controller = Botkit.teamsbot({
    debug: true,
});

controller.hears('.*','message_received', function(bot, message) {

    bot.reply(message, 'OK');

});


controller.setupWebserver(3000,function() {

    controller.webserver.post('/teams/receive', function(req, res) {

        console.log('RECEIVED EVENT', req.body);
        res.send('');

        var message = req.body;
        if (message.type == 'message') {
            var bot = controller.spawn({});
            controller.receiveMessage(bot, {
                user: message.from.id,
                channel: message.conversation.id,
                text: message.text,
                original_message: message,
            });
        } else {
            controller.trigger(message.type,[bot, message]);
        }

});

});
