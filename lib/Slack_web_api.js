var request = require('request');

module.exports = function(bot, config) {

    // create a nice wrapper for the Slack API
    var slack_api = {
        api_url: 'https://slack.com/api/',
        // this is a simple function used to call the slack web API
        callAPI: function(command, options, cb) {
            bot.log('** API CALL: ' + slack_api.api_url + command);
            if (!options.token) {
                options.token = config.token;
            }
            bot.debug(command, options);
            request.post(this.api_url + command, function(error, response, body) {
                bot.debug('Got response', error, body);
                if (!error && response.statusCode == 200) {
                    var json = JSON.parse(body);
                    if (json.ok) {
                        if (cb) cb(null, json);
                    } else {
                        if (cb) cb(json.error, json);
                    }
                } else {
                    if (cb) cb(error);
                }
            }).form(options);
        },
        callAPIWithoutToken: function(command, options, cb) {
            bot.log('** API CALL: ' + slack_api.api_url + command);
            if (!options.client_id) {
                options.client_id = bot.config.clientId;
            }
            if (!options.client_secret) {
                options.client_secret = bot.config.clientSecret;
            }
            if (!options.redirect_uri) {
                options.redirect_uri = bot.config.redirectUri;
            }
            request.post(this.api_url + command, function(error, response, body) {
                bot.debug('Got response', error, body);
                if (!error && response.statusCode == 200) {
                    var json = JSON.parse(body);
                    if (json.ok) {
                        if (cb) cb(null, json);
                    } else {
                        if (cb) cb(json.error, json);
                    }
                } else {
                    if (cb) cb(error);
                }
            }).form(options);
        },
        auth: {
            test: function(options, cb) {
                slack_api.callAPI('auth.test', options, cb);
            }
        },
        oauth: {
            access: function(options, cb) {
                slack_api.callAPIWithoutToken('oauth.access', options, cb);
            }
        },
        channels: {
            archive: function(options, cb) {
                slack_api.callAPI('channels.archive', options, cb);
            },
            create: function(options, cb) {
                slack_api.callAPI('channels.create', options, cb);
            },
            history: function(options, cb) {
                slack_api.callAPI('channels.history', options, cb);
            },
            info: function(options, cb) {
                slack_api.callAPI('channels.info', options, cb);
            },
            invite: function(options, cb) {
                slack_api.callAPI('channels.invite', options, cb);
            },
            join: function(options, cb) {
                slack_api.callAPI('channels.join', options, cb);
            },
            kick: function(options, cb) {
                slack_api.callAPI('channels.kick', options, cb);
            },
            leave: function(options, cb) {
                slack_api.callAPI('channels.leave', options, cb);
            },
            list: function(options, cb) {
                slack_api.callAPI('channels.list', options, cb);
            },
            mark: function(options, cb) {
                slack_api.callAPI('channels.mark', options, cb);
            },
            rename: function(options, cb) {
                slack_api.callAPI('channels.rename', options, cb);
            },
            setPurpose: function(options, cb) {
                slack_api.callAPI('channels.setPurpose', options, cb);
            },
            setTopic: function(options, cb) {
                slack_api.callAPI('channels.setTopic', options, cb);
            },
            unarchive: function(options, cb) {
                slack_api.callAPI('channels.unarchive', options, cb);
            }
        },
        chat: {
            delete: function(options, cb) {
                slack_api.callAPI('chat.delete', options, cb);
            },
            postMessage: function(options, cb) {
                if (options.attachments && typeof(options.attachments) != 'string') {
                    options.attachments = JSON.stringify(options.attachments);
                }
                slack_api.callAPI('chat.postMessage', options, cb);
            },
            update: function(options, cb) {
                slack_api.callAPI('chat.update', options, cb);
            }
        },
        emoji: {
            list: function(options, cb) {
                slack_api.callAPI('emoji.list', options, cb);
            }
        },
        files: {
            delete: function(options, cb) {
                slack_api.callAPI('files.delete', options, cb);
            },
            info: function(options, cb) {
                slack_api.callAPI('files.info', options, cb);
            },
            list: function(options, cb) {
                slack_api.callAPI('files.list', options, cb);
            },
            upload: function(options, cb) {
                slack_api.callAPI('files.upload', options, cb);
            },
        },
        groups: {
            archive: function(options, cb) {
                slack_api.callAPI('groups.archive', options, cb);
            },
            close: function(options, cb) {
                slack_api.callAPI('groups.close', options, cb);
            },
            create: function(options, cb) {
                slack_api.callAPI('groups.create', options, cb);
            },
            createChild: function(options, cb) {
                slack_api.callAPI('groups.createChild', options, cb);
            },
            history: function(options, cb) {
                slack_api.callAPI('groups.history', options, cb);
            },
            info: function(options, cb) {
                slack_api.callAPI('groups.info', options, cb);
            },
            invite: function(options, cb) {
                slack_api.callAPI('groups.invite', options, cb);
            },
            kick: function(options, cb) {
                slack_api.callAPI('groups.kick', options, cb);
            },
            leave: function(options, cb) {
                slack_api.callAPI('groups.leave', options, cb);
            },
            list: function(options, cb) {
                slack_api.callAPI('groups.list', options, cb);
            },
            mark: function(options, cb) {
                slack_api.callAPI('groups.mark', options, cb);
            },
            open: function(options, cb) {
                slack_api.callAPI('groups.open', options, cb);
            },
            rename: function(options, cb) {
                slack_api.callAPI('groups.rename', options, cb);
            },
            setPurpose: function(options, cb) {
                slack_api.callAPI('groups.setPurpose', options, cb);
            },
            setTopic: function(options, cb) {
                slack_api.callAPI('groups.setTopic', options, cb);
            },
            unarchive: function(options, cb) {
                slack_api.callAPI('groups.unarchive', options, cb);
            },
        },
        im: {
            close: function(options, cb) {
                slack_api.callAPI('im.close', options, cb);
            },
            history: function(options, cb) {
                slack_api.callAPI('im.history', options, cb);
            },
            list: function(options, cb) {
                slack_api.callAPI('im.list', options, cb);
            },
            mark: function(options, cb) {
                slack_api.callAPI('im.mark', options, cb);
            },
            open: function(options, cb) {
                slack_api.callAPI('im.open', options, cb);
            }
        },
        mpim: {
            close: function(options, cb) {
                slack_api.callAPI('mpim.close', options, cb);
            },
            history: function(options, cb) {
                slack_api.callAPI('mpim.history', options, cb);
            },
            list: function(options, cb) {
                slack_api.callAPI('mpim.list', options, cb);
            },
            mark: function(options, cb) {
                slack_api.callAPI('mpim.mark', options, cb);
            },
            open: function(options, cb) {
                slack_api.callAPI('mpim.open', options, cb);
            }
        },
        pins: {
            add: function(options, cb) {
                slack_api.callAPI('pins.add', options, cb);
            },
            list: function(options, cb) {
                slack_api.callAPI('pins.list', options, cb);
            },
            remove: function(options, cb) {
                slack_api.callAPI('pins.remove', options, cb);
            }
        },
        reactions: {
            add: function(options, cb) {
                slack_api.callAPI('reactions.add', options, cb);
            },
            get: function(options, cb) {
                slack_api.callAPI('reactions.get', options, cb);
            },
            list: function(options, cb) {
                slack_api.callAPI('reactions.list', options, cb);
            },
            remove: function(options, cb) {
                slack_api.callAPI('reactions.remove', options, cb);
            },
        },
        rtm: {
            start: function(options, cb) {
                slack_api.callAPI('rtm.start', options, cb);
            },
        },
        search: {
            all: function(options, cb) {
                slack_api.callAPI('search.all', options, cb);
            },
            files: function(options, cb) {
                slack_api.callAPI('search.files', options, cb);
            },
            messages: function(options, cb) {
                slack_api.callAPI('search.messages', options, cb);
            },
        },
        stars: {
            list: function(options, cb) {
                slack_api.callAPI('stars.list', options, cb);
            },
        },
        team: {
            accessLogs: function(options, cb) {
                slack_api.callAPI('team.accessLogs', options, cb);
            },
            info: function(options, cb) {
                slack_api.callAPI('team.info', options, cb);
            },
        },
        users: {
            getPresence: function(options, cb) {
                slack_api.callAPI('users.getPresence', options, cb);
            },
            info: function(options, cb) {
                slack_api.callAPI('users.info', options, cb);
            },
            list: function(options, cb) {
                slack_api.callAPI('users.list', options, cb);
            },
            setActive: function(options, cb) {
                slack_api.callAPI('users.setActive', options, cb);
            },
            setPresence: function(options, cb) {
                slack_api.callAPI('users.setPresence', options, cb);
            },
        }
    };

    return slack_api;

};
