var Botkit = require('../lib/Botkit.js');

var controller = Botkit.googlehangoutsbot({
    endpoint: 'Axjn86rTGRQwisaYFyT0XZyiOCh7rZUPGx1A',
    token: "YOUR_TOKEN",
    debug: true,
});

var bot = controller.spawn({});

controller.setupWebserver(3000, function (err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function () {
        console.log(`🚀 Congratulation, the web server is online!`);
    });
});

controller.on('message_received', function (bot, message) {
    bot.reply(message, `You said '${message.text}'`);
});

controller.hears('new thread', 'message_received', function (bot, message) {
    bot.replyAsNewThread(message, `Hello ! this is a new thread`);
});

controller.hears('thread key', 'message_received', function (bot, message) {
    bot.replyWithThreadKey(message, {
        threadKey : "YOUR_THREAD_KEY",
        requestBody : {
            text : `Hi ! this message inside the same thread`
        }
    });
});

controller.hears('convo', 'message_received', function (bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.ask('You want to know more about Botkit ?', [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Take a look here https://botkit.ai/docs/');
                    convo.next();
                }
            },
            {
                pattern: bot.utterances.no,
                default: true,
                callback: function(response, convo) {
                    convo.say('No problem');
                    convo.next();
                }
            }
        ]);
    });

});

controller.hears('cards', 'message_received', function (bot, message) {
    bot.reply(message, {
        requestBody: {
            cards: [
                {
                    "sections": [
                        {
                            "widgets": [
                                {
                                    "image": { "imageUrl": "https://image.slidesharecdn.com/botkitsignal-160526164159/95/build-a-bot-with-botkit-1-638.jpg?cb=1464280993" }
                                },
                                {
                                    "buttons": [
                                        {
                                            "textButton": {
                                                "text": "Get Started",
                                                "onClick": {
                                                    "openLink": {
                                                        "url": "https://botkit.ai/docs/"
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    });
});

controller.on('card_clicked', function (bot, message) {
    bot.reply(message, 'This is a card click');
});
