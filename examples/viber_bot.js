var Botkit = require('../lib/Botkit.js');
var ViberMessage = Botkit.vibermessage;
var controller = Botkit.viberbot(Botkit, {
    viberToken: 'xxxxxxx',
    webhookUri: 'https://74c20533.ngrok.io/webhook',
    serverPort: '8080',
    botName: "Bot name",
    botAvatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Monophasic.svg/200px-Monophasic.svg.png"
});

// this is the way you can subscribe to viber events 
controller.on('webhook', function (bot, message) {
    console.log('Webhook has been set.');
});

// give the bot something to listen for.
controller.hears(
    ['hello'],
    'message',
    function (bot, message) {
        bot.createConversation(message, function (err, convo) {

            convo.addMessage(new ViberMessage.TextMessage("Giddy up, I’m right behind ya’"), 'yes_thread');

            convo.addMessage(new ViberMessage.TextMessage("Well, more for me then :) "), 'no_thread');

            convo.addQuestion(new ViberMessage.TextMessage("Howdy partner, Are you going down to wet your whistle at the saloon tonight?"), [
                {
                    pattern: 'yes',
                    callback: function (response, convo) {
                        convo.gotoThread('yes_thread');
                    },
                },
                {
                    pattern: 'no',
                    callback: function (response, convo) {
                        convo.gotoThread('no_thread');
                    },
                },
                {
                    default: true,
                    callback: function (response, convo) {
                        convo.gotoThread('default');
                    },
                }
            ], {}, 'default');

            convo.activate();
        });
    });