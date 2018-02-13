var request = require('request');
var SmoochCore = require('smooch-core');

var worker = function(botkit, config) {
    var api = new SmoochCore({
        keyId: botkit.config.key,
        secret: botkit.config.secret,
        scope: 'app'
    });

    var bot = {
        type: 'smooch',
        botkit: botkit,
        config: config || {},
        utterances: botkit.utterances,
        api: api
    };

    this.say = function(message, cb) {
        botkit.debug('SAY:', message);
        bot.api.conversations.sendMessage(message.appId, message.userId).then(function(response) {
            if (cb) {
                cb(null, response);
            }
        }).catch(function(e) {
            botkit.debug(e);
        });
    };

    this.reply = function(src, resp) {
        var message = {};

        if (typeof(resp) === 'string') {
            message.text = resp;
            message.user = src.user;
        } else {
            message = resp;
            message.user = src.user;
        }

        botkit.debug('REPLY:', resp);
        bot.say(message);
    };

    bot.findConversation = function(message, cb) {
        botkit.debug('CUSTOM FIND CONVO', message.user, message.channel);
        for (var t = 0; t < botkit.tasks.length; t++) {
            for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
                if (
                    botkit.tasks[t].convos[c].isActive() &&
                    botkit.tasks[t].convos[c].source_message.user === message.user &&
                    botkit.tasks[t].convos[c].source_message.channel === message.channel &&
                    botkit.excludedEvents.indexOf(message.type) === -1
                ) {
                    botkit.debug('FOUND EXISTING CONVO!');
                    cb(botkit.tasks[t].convos[c]);
                    return;
                }
            }
        }

        cb();
    };

    return bot;
};

module.exports = worker;
