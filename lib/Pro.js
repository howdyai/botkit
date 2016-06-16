var _BOTKIT_SCRIPT_API = 'http://192.168.33.13:3000';
var _BOTKIT_LOGIN_API = 'http://192.168.33.17:3000';
var request = require('request');
var Promise = require('promise');

module.exports = function(botkit) {

    botkit.middleware.spawn.use(function(bot, next) {

        botkit.loginToHowdy(bot,{
            username: bot.config.howdy_key,
            password: bot.config.howdy_secret,
        }).then(function(session) {

            console.log('GOT A SESSION', session);
            bot.howdy_session = session;

        }).catch(function(err) {
            console.log('ERROR LOGGING IN ', err);
            throw new Error(err);
        });
    });

    function howdyAPI(bot,options) {
        return new Promise(function(resolve,reject) {

            var headers = {
                'content-type': 'application/json',
            };

            console.log('Making an API call to ',options.uri);


            if (bot.howdy_session) {
                console.log('Using authenticated session');
                options.headers.session = JSON.stringify(howdy_session);
            }

            options.headers = headers;

            request(options, function(err,res,body) {

                console.log('Received results:');

                if (err) {
                    console.log('Rejecting because of error!');
                    return reject(err);
                }

                json = JSON.parse(body);
                if (json) {
                    if (json.error) {
                        console.log('Rejecting because JSON error');
                        reject(json.error);
                    } else {
                        console.log('Accepting!', json);
                        resolve(json);
                    }
                } else {
                    return reject('Invalid JSON');
                }
            });
        });

    }

    botkit.loginToHowdy = function(bot, options) {

        console.log('getting session...');

        var url = _BOTKIT_LOGIN_API + '/api/v1/users/login';
        return howdyAPI(bot, {
            uri: url,
            body: JSON.stringify(options),
            method: 'POST',
        });
    };


    // load a script from the pro service
    botkit.loadScriptFromPro = function(bot,script_id) {

        var url = _BOTKIT_PRO_API + '/api/v1/script/' + script_id;
        console.log(url);
        return howdyAPI(bot, {
            uri: url,
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
            botkit.loadScriptFromPro(bot, '574f5df9a77186e706d965b2').then(function(topics) {
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
