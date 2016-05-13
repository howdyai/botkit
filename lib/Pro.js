var _BOTKIT_PRO_API = 'https://beta.botfarm.co';
var request = require('request');
var Promise = require('promise');

module.exports = function(botkit) {

    // load a script from the pro service
    botkit.loadScriptFromPro = function(bot,trigger) {
        return new Promise(function(resolve,reject) {
            console.log('loading script...');

            var url = _BOTKIT_PRO_API + '/api/scripts/' + bot.config.BOTKIT_API_KEY + '/' + encodeURIComponent(trigger);
            console.log(url);
            request({
                'uri': url,
            }, function(err,res,body) {

                console.log('loaded');

                if (err) {
                    console.log('rejecting');
                    return reject(err);
                }

                json = JSON.parse(body);
                if (json && json.ok) {
                    console.log('rad');
                    resolve(json.script);
                } else {
                    return reject('Invalid JSON');
                }
            });
        });
    };

    botkit.compileScript = function(bot, message, topics) {

        function makeHandler(options) {

            return {
                pattern: options.pattern,
                default: options.default,
                callback: function(response, convo) {
                    switch (options.action) {
                            case 'next':
                                convo.next();
                                break;
                            case 'repeat':
                                convo.repeat();
                                convo.next();
                                break;
                            case 'stop':
                                convo.stop();
                                break;
                            default:
                                convo.changeTopic(options.action);
                                break;
                    }
                }
            }

        }

        return new Promise(function(resolve,reject) {
            bot.startConversation(message, function(err, convo) {
                if (err) { return reject(err); }

            //    parseScript(script_raw).then(function(topics) {
                    for (var t=0; t < topics.length; t++) {
                        var topic = topics[t].topic;
                        for (var m = 0; m < topics[t].script.length; m++) {
                            // is this a question?
                            topics[t].script[m].delay = 3000;
                            if (topics[t].script[m].collect) {
                                // this is a question message
                                var capture_options = {};
                                var handlers = [];
                                var options = topics[t].script[m].collect.options || [];
                                if (topics[t].script[m].collect.key) {
                                    capture_options.key = topics[t].script[m].collect.key;
                                }
                                var default_found = false;
                                for (var o = 0; o < options.length; o++) {
                                    var handler = makeHandler(options[o]);
                                    handlers.push(handler);
                                    if (options[o].default) {
                                        default_found = true;
                                    }
                                }

                                // make sure there is a default
                                if (!default_found) {
                                    handlers.push({
                                        default: true,
                                        callback: function(r,c) { c.next(); }
                                    });
                                };

                                convo.addQuestion(topics[t].script[m],handlers,capture_options,topic);

                            } else {
                                // this is a simple message
                                convo.addMessage(topics[t].script[m],topic);
                            }
                        }
                    }
                // }).catch(function(err) {
                //     convo.say('Error parsing script: ' + err);
                // });

                convo.on('end',function(convo) {
                    resolve(convo);
                });
            });
        });
    };

    botkit.triggerConversation = function(bot, message) {
        console.log('triggering...');
        return new Promise(function(resolve,reject) {
            botkit.loadScriptFromPro(bot, message.text).then(function(topics) {
                botkit.compileScript(bot, message, topics).then(function(convo) {
                    resolve(convo);
                }).catch(function(err) {
                    reject(err);
                });
            }).catch(function(err) {
                reject(err);
            });
        });

    }

};
