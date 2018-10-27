module.exports = function ViberBot(Botkit, config) {
    var server = require('express')();
    var httpClient = require('request-promise');
    var bodyParser = require('body-parser');

    function setWebhook() {
        server.use(bodyParser.json());
        server.use('/' + removeHostFromWebhook(config.webhookUri) , function(req, res) {
            controller.handleWebhookPayload(req, res);
        });
        server.listen(config.serverPort);
        console.log('Bot is listening at port:', config.serverPort);
        registerWebhookOnViberPlatfrom(config.webhookUri);
    }

    function removeHostFromWebhook(url) {
        var urlSplit = url.split('/');
        var host = urlSplit[0] + '//' + urlSplit[2] + '/';
        return url.replace(host, '');
    }

    function registerWebhookOnViberPlatfrom(webhookUri) {
        let opts = {
            method: 'POST',
            uri: 'https://chatapi.viber.com/pa/set_webhook',
            headers: {
                'X-Viber-Auth-Token': config.viberToken,
                'Content-Type': 'application/json'
            },
            body: {
                'url': webhookUri,
            },
            json: true
        };
        httpClient(opts)
            .catch(function(err) {
                console.log('Some problem happend while setting webhook.');
            });
    }

    function sendMessageToViberPlatform(message) {

        message.receiver = message.channel;
        if (message.sender) {
            message.sender.name = config.botName;
            message.sender.avatar = config.botAvatar;
        }

        httpClient({
            method: 'POST',
            uri: 'https://chatapi.viber.com/pa/send_message',
            headers: {
                'X-Viber-Auth-Token': config.viberToken
            },
            body: message,
            json: true
        })
            .catch(function(err) {
                console.log('Some problem happend while sending message to Viber platform.');
            });
    }

    var controller = Botkit.core(config || {});

    controller.defineBot(function(botkit, config) {

        var bot = {
            type: 'viber',
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
        };

        // here is where you make the API call to SEND a message
        // the message object should be in the proper format already
        bot.send = function(message, cb) {
            sendMessageToViberPlatform(message);
            if (cb) {
                cb();
            }
        };

        // this function takes an incoming message (from a user) and an outgoing message (reply from bot)
        // and ensures that the reply has the appropriate fields to appear as a reply
        bot.reply = function(src, resp, cb) {
            resp.channel = src.channel;
            bot.say(resp, cb);
        };

        bot.startConversation = function(message, cb) {
            botkit.startConversation(this, message, cb);
        };

        bot.createConversation = function(message, cb) {
            botkit.createConversation(this, message, cb);
        };

        // this function defines the mechanism by which botkit looks for ongoing conversations
        // probably leave as is!
        bot.findConversation = function(message, cb) {
            for (var t = 0; t < botkit.tasks.length; t++) {
                for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
                    if (
                        botkit.tasks[t].convos[c].isActive() &&
                        botkit.tasks[t].convos[c].source_message.user == message.user &&
                        botkit.excludedEvents.indexOf(message.type) == -1 // this type of message should not be included
                    ) {
                        cb(botkit.tasks[t].convos[c]);
                        return;
                    }
                }
            }
            cb();
        };

        return bot;

    });

    // provide one or more normalize middleware functions that take a raw incoming message
    // and ensure that the key botkit fields are present -- user, channel, text, and type
    controller.middleware.normalize.use(function(bot, message, next) {
        message.user = message.raw_message && message.raw_message.sender ? message.raw_message.sender.id : null;
        message.channel = message.raw_message && message.raw_message.sender ? message.raw_message.sender.id : null;
        message.text = message.raw_message && message.raw_message.message && message.raw_message.message.text ? message.raw_message.message.text : null;
        message.type = message.event;
        next();
    });


    // provide one or more ways to format outgoing messages from botkit messages into
    // the necessary format required by the platform API
    // at a minimum, copy all fields from `message` to `platform_message`
    controller.middleware.format.use(function(bot, message, platform_message, next) {
        for (var k in message) {
            platform_message[k] = message[k];
        }
        next();
    });

    // provide a way to receive messages - normally by handling an incoming webhook as below!
    controller.handleWebhookPayload = function(req, res) {
        var payload = req.body;
        controller.ingest(controller.spawn({}), payload, res);
        res.status(200);
        res.send({});
    };

    setWebhook();
    controller.startTicking();

    return controller;

};
