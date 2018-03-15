var Botkit = require(__dirname + '/CoreBot.js');
const Stanza = require('node-xmpp-client').Stanza;
const GroupManager = require('./JabberGroupManager.js');

function JabberBot(configuration) {
    // Create a core botkit bot
    var controller = Botkit(configuration || {});


    function toUTCDateTimeString(date) {
        var yyyy = date.getUTCFullYear();
        var mm = date.getUTCMonth() < 9 ? '0' + (date.getUTCMonth() + 1) : (date.getUTCMonth() + 1); // getMonth() is zero-based
        var dd = date.getUTCDate() < 10 ? '0' + date.getUTCDate() : date.getUTCDate();
        var hh = date.getUTCHours() < 10 ? '0' + date.getUTCHours() : date.getUTCHours();
        var min = date.getUTCMinutes() < 10 ? '0' + date.getUTCMinutes() : date.getUTCMinutes();
        var ss = date.getUTCSeconds() < 10 ? '0' + date.getUTCSeconds() : date.getUTCSeconds();
        return ''.concat(yyyy).concat('-').concat(mm).concat('-').concat(dd).concat('T').concat(hh).concat(':').concat(min).concat(':').concat(ss);
    };

    controller.middleware.format.use(function(bot, message, platform_message, next) {
        // clone the incoming message
        for (var k in message) {
            platform_message[k] = message[k];
        }
        next();
    });

    // customize the bot definition, which will be used when new connections
    // spawn!
    controller.defineBot(function(botkit, config) {
        var xmpp = require('simple-xmpp');

        var bot = {
            type: 'xmpp',
            botkit: botkit,
            config: config || {},
            client_jid: config.client.jid,
            utterances: botkit.utterances,
        };

        GroupManager(config, xmpp, bot, controller);

        function request_roster() {
            let roster_stanza = new Stanza('iq', { 'from': config.client, 'type': 'get'});
            roster_stanza.c('query', { xmlns: 'jabber:iq:roster'});
            xmpp.conn.send(roster_stanza);
        }

        xmpp.on('online', function(data) {
            console.log(toUTCDateTimeString(new Date()) + ':Connected with JID: ' + data.jid.user);
            console.log('Yes, I\'m connected!');
            request_roster();

            // send whitespace to keep the connection alive
            // and prevent timeouts
            setInterval(function() {
                xmpp.conn.send(' ');
            }, 1800000);
        });

        xmpp.on('close', function() {
            console.log(toUTCDateTimeString(new Date()) + ':connection has been closed!');
            process.exit();
        });

        xmpp.on('error', function(err) {
            console.log(toUTCDateTimeString(new Date()) + ':' + err);
            process.exit();
        });

        xmpp.on('subscribe', function(from) {
            xmpp.acceptSubscription(from);
            console.log(toUTCDateTimeString(new Date()) + ':accept subscribe from:' + from);
            controller.trigger('subscribe', [bot, from]);
        });

        xmpp.on('unsubscribe', function(from) {
            console.log(toUTCDateTimeString(new Date()) + ':accept unsubscribe from:' + from);
            xmpp.acceptUnsubscription(from);
        });

        function findBotJid(jid) {
            return jid === bot.client_jid;
        }

        function matchBotJid(jid_left, jid_right) {
            return jid_left.toLowerCase() === jid_right.toLowerCase();
        }

        function IsBotMentioned(message) {
            let mention_jids = extractMentionJids(message);
            if (mention_jids.find(findBotJid)) {
                return true;
            }
            return false;
        }

        function extractMentionJids(message) {
            let direct_mention_reg = /href="xmpp:\s?(\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+)\s?"/ig;
            let email_reg = /\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+/i;
            let match = message.stanza.toString().match(direct_mention_reg);
            let mention_jids = [];
            if (match) {
                for (let i = 0; i < match.length; i++) {
                    let jid_match = match[i].match(email_reg);
                    if (jid_match) {
                        let jid = jid_match[0];
                        mention_jids.push(jid);
                    }
                }
            }
            return mention_jids;
        }

        controller.on('message_received', function(bot, message) {
            if (message.group == false) {
                if (matchBotJid(message.user, bot.client_jid)) {
                    controller.trigger('self_message', [bot, message]);
                    return false;
                } else {
                    controller.trigger('direct_message', [bot, message]);
                    return false;
                }
            } else {
                if (IsBotMentioned(message)) {
                    if (matchBotJid(bot.client_jid, message.from_jid)) {
                        controller.trigger('self_message', [bot, message]);
                    } else {
                        controller.trigger('direct_mention', [bot, message]);
                    }
                    return false;
                }
            }
        });

        xmpp.on('stanza', function(stanza) {
            if (stanza.is('message')) {
                if (stanza.attrs.type == 'chat') {
                    var body = stanza.getChild('body');
                    if (body) {
                        var message = body.getText();
                        var from = stanza.attrs.from;
                        var id = from.split('/')[0];

                        var xmpp_message = {};
                        xmpp_message.user = from;
                        xmpp_message.text = message;
                        xmpp_message.group = false;
                        xmpp_message.stanza = stanza;
                        xmpp_message.channel = 'chat',
                        controller.ingest(bot, xmpp_message, null);
                    }
                } else if (stanza.attrs.type == 'groupchat') {
                    var body = stanza.getChild('body');
                    if (body) {
                        let message = body.getText();
                        let from = stanza.attrs.from;
                        let from_split = from.split('/');
                        let conference = from_split[0];
                        let from_jid = null;
                        if (from_split.length > 1)
                            from_jid = from_split[1];
                        if (!from_jid)
                            return;

                        let history_reg = /xmlns="http:\/\/www.jabber.com\/protocol\/muc#history"/i;
                        if (history_reg.test(stanza.toString()))
                            return false;

                        var xmpp_message = {};
                        xmpp_message.user = conference;
                        xmpp_message.text = message;
                        xmpp_message.group = true;
                        xmpp_message.channel = 'groupchat';
                        xmpp_message.from_jid = from_jid;
                        xmpp_message.stanza = stanza;
                        controller.ingest(bot, xmpp_message, null);
                    }
                }
            }
        });

        bot.startConversation = function(message, cb) {
            botkit.startConversation(this, message, cb);
        };

        bot.createConversation = function(message, cb) {
            botkit.createConversation(this, message, cb);
        };

        bot.send = function(message, cb) {
            if (message.stanza) {
                xmpp.conn.send(message.stanza);
            } else {
                xmpp.send(message.user, message.text, message.group);
            }

            if (cb) {
                cb();
            }
        };

        bot.reply = function(src, resp, cb) {
            var msg = {};

            if (typeof (resp) == 'string') {
                msg.text = resp;
            } else {
                msg = resp;
            }
            msg.user = src.user;
            msg.channel = src.channel;
            msg.group = src.group;

            bot.say(msg, cb);
        };

        bot.findConversation = function(message, cb) {
            botkit.debug('CUSTOM FIND CONVO', message.user, message.channel);
            for (var t = 0; t < botkit.tasks.length; t++) {
                for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
                    if (
                        botkit.tasks[t].convos[c].isActive() &&
                        botkit.tasks[t].convos[c].source_message.user == message.user &&
                        botkit.tasks[t].convos[c].source_message.channel == message.channel
                    ) {
                        botkit.debug('FOUND EXISTING CONVO!');
                        cb(botkit.tasks[t].convos[c]);
                        return;
                    }
                }
            }

            cb();
        };

        xmpp.connect(config.client);
        return bot;
    });

    controller.startTicking();

    return controller;
}

module.exports = JabberBot;
