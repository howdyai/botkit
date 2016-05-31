function loadBotLogic(controller, bot) {
    controller.hears(['hello', 'hi'], 'message_received', function (bot, message) {
        controller.storage.users.get(message.user, function (err, user) {
            if (user && user.name) {
                bot.reply(message, 'Hello ' + user.name + '!!');
            } else {
                bot.reply(message, 'Hello.');
            }
        });
    });


    controller.hears(['structured'], 'message_received', function (bot, message) {

        bot.startConversation(message, function (err, convo) {
            convo.ask({
                attachment: {
                    'type': 'template',
                    'payload': {
                        'template_type': 'generic',
                        'elements': [
                            {
                                'title': 'Classic White T-Shirt',
                                'image_url': 'http://petersapparel.parseapp.com/img/item100-thumb.png',
                                'subtitle': 'Soft white cotton t-shirt is back in style',
                                'buttons': [
                                    {
                                        'type': 'web_url',
                                        'url': 'https://petersapparel.parseapp.com/view_item?item_id=100',
                                        'title': 'View Item'
                                    },
                                    {
                                        'type': 'web_url',
                                        'url': 'https://petersapparel.parseapp.com/buy_item?item_id=100',
                                        'title': 'Buy Item'
                                    },
                                    {
                                        'type': 'postback',
                                        'title': 'Bookmark Item',
                                        'payload': 'White T-Shirt'
                                    }
                                ]
                            },
                            {
                                'title': 'Classic Grey T-Shirt',
                                'image_url': 'http://petersapparel.parseapp.com/img/item101-thumb.png',
                                'subtitle': 'Soft gray cotton t-shirt is back in style',
                                'buttons': [
                                    {
                                        'type': 'web_url',
                                        'url': 'https://petersapparel.parseapp.com/view_item?item_id=101',
                                        'title': 'View Item'
                                    },
                                    {
                                        'type': 'web_url',
                                        'url': 'https://petersapparel.parseapp.com/buy_item?item_id=101',
                                        'title': 'Buy Item'
                                    },
                                    {
                                        'type': 'postback',
                                        'title': 'Bookmark Item',
                                        'payload': 'Grey T-Shirt'
                                    }
                                ]
                            }
                        ]
                    }
                }
            }, function (response, convo) {
                // whoa, I got the postback payload as a response to my convo.ask!
                convo.next();
            });
        });
    });

    controller.on('facebook_postback', function (bot, message) {

        bot.reply(message, 'Great Choice!!!! (' + message.payload + ')');

    });


    controller.hears(['call me (.*)', 'my name is (.*)'], 'message_received', function (bot, message) {
        var name = message.match[1];
        controller.storage.users.get(message.user, function (err, user) {
            if (!user) {
                user = {
                    id: message.user,
                };
            }
            user.name = name;
            controller.storage.users.save(user, function (err, id) {
                bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
            });
        });
    });

    controller.hears(['what is my name', 'who am i'], 'message_received', function (bot, message) {
        controller.storage.users.get(message.user, function (err, user) {
            if (user && user.name) {
                bot.reply(message, 'Your name is ' + user.name);
            } else {
                bot.startConversation(message, function (err, convo) {
                    if (!err) {
                        convo.say('I do not know your name yet!');
                        convo.ask('What should I call you?', function (response, convo) {
                            convo.ask('You want me to call you `' + response.text + '`?', [
                                {
                                    pattern: 'yes',
                                    callback: function (response, convo) {
                                        // since no further messages are queued after this,
                                        // the conversation will end naturally with status == 'completed'
                                        convo.next();
                                    }
                                },
                                {
                                    pattern: 'no',
                                    callback: function (response, convo) {
                                        // stop the conversation. this will cause it to end with status == 'stopped'
                                        convo.stop();
                                    }
                                },
                                {
                                    default: true,
                                    callback: function (response, convo) {
                                        convo.repeat();
                                        convo.next();
                                    }
                                }
                            ]);

                            convo.next();

                        }, {'key': 'nickname'}); // store the results in a field called nickname

                        convo.on('end', function (convo) {
                            if (convo.status == 'completed') {
                                bot.reply(message, 'OK! I will update my dossier...');

                                controller.storage.users.get(message.user, function (err, user) {
                                    if (!user) {
                                        user = {
                                            id: message.user,
                                        };
                                    }
                                    user.name = convo.extractResponse('nickname');
                                    controller.storage.users.save(user, function (err, id) {
                                        bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                    });
                                });


                            } else {
                                // this happens if the conversation ended prematurely for some reason
                                bot.reply(message, 'OK, nevermind!');
                            }
                        });
                    }
                });
            }
        });
    });

    controller.hears(['shutdown'], 'message_received', function (bot, message) {

        bot.startConversation(message, function (err, convo) {

            convo.ask('Are you sure you want me to shutdown?', [
                {
                    pattern: bot.utterances.yes,
                    callback: function (response, convo) {
                        convo.say('Bye!');
                        convo.next();
                        setTimeout(function () {
                            process.exit();
                        }, 3000);
                    }
                },
                {
                    pattern: bot.utterances.no,
                    default: true,
                    callback: function (response, convo) {
                        convo.say('*Phew!*');
                        convo.next();
                    }
                }
            ]);
        });
    });


    controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'], 'message_received',
      function (bot, message) {

          var hostname = os.hostname();
          var uptime = formatUptime(process.uptime());

          bot.reply(message,
            ':|] I am a bot. I have been running for ' + uptime + ' on ' + hostname + '.');
      });


    controller.on('message_received', function (bot, message) {
        bot.reply(message, 'Try: `what is my name` or `structured` or `call me captain`');
        return false;
    });


    function formatUptime(uptime) {
        var unit = 'second';
        if (uptime > 60) {
            uptime = uptime / 60;
            unit = 'minute';
        }
        if (uptime > 60) {
            uptime = uptime / 60;
            unit = 'hour';
        }
        if (uptime != 1) {
            unit = unit + 's';
        }

        uptime = uptime + ' ' + unit;
        return uptime;
    }
}

module.exports = loadBotLogic;
