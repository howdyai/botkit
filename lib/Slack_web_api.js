var request = require('request');

function noop() {}

module.exports = function(bot, config) {
    var slack_api = {
        api_url: 'https://slack.com/api/'
    };

    // Slack API methods: https://api.slack.com/methods
    var slackApiMethods = [
        'auth.test',
        'oauth.access',
        'channels.archive',
        'channels.create',
        'channels.history',
        'channels.info',
        'channels.invite',
        'channels.join',
        'channels.kick',
        'channels.leave',
        'channels.list',
        'channels.mark',
        'channels.rename',
        'channels.setPurpose',
        'channels.setTopic',
        'channels.unarchive',
        'chat.delete',
        'chat.postMessage',
        'chat.update',
        'emoji.list',
        'files.delete',
        'files.info',
        'files.list',
        'files.upload',
        'groups.archive',
        'groups.close',
        'groups.create',
        'groups.createChild',
        'groups.history',
        'groups.info',
        'groups.invite',
        'groups.kick',
        'groups.leave',
        'groups.list',
        'groups.mark',
        'groups.open',
        'groups.rename',
        'groups.setPurpose',
        'groups.setTopic',
        'groups.unarchive',
        'im.close',
        'im.history',
        'im.list',
        'im.mark',
        'im.open',
        'mpim.close',
        'mpim.history',
        'mpim.list',
        'mpim.mark',
        'mpim.open',
        'pins.add',
        'pins.list',
        'pins.remove',
        'reactions.add',
        'reactions.get',
        'reactions.list',
        'reactions.remove',
        'rtm.start',
        'search.all',
        'search.files',
        'search.messages',
        'stars.list',
        'team.accessLogs',
        'team.info',
        'users.getPresence',
        'users.info',
        'users.list',
        'users.setActive'
    ];

    slack_api.callAPI = function(command, options, cb) {
        cb = cb || noop;

        bot.log('** API CALL: ' + slack_api.api_url + command);
        if (!options.token) {
            options.token = config.token;
        }

        bot.debug(command, options);
        request.post(slack_api.api_url + command, function(error, response, body) {
            bot.debug('Got response', error, body);
            if (!error && response.statusCode == 200) {
                var json;
                try {
                    json = JSON.parse(body);
                } catch (err) {
                    return cb(err);
                }

                if (json.ok) {
                    return cb(null, json);
                }

                return cb(json.error, json);
            }

            return cb(error || 'Invalid response');
        }).form(options);
    };

    slack_api.callAPIWithoutToken = function(command, options, cb) {
        cb = cb || noop;

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
        request.post(slack_api.api_url + command, function(error, response, body) {
            bot.debug('Got response', error, body);
            if (!error && response.statusCode == 200) {
                var json;
                try {
                    json = JSON.parse(body);
                } catch (err) {
                    return cb(err || 'Invalid JSON');
                }

                if (json.ok) {
                    return cb(null, json);
                }
                return cb(json.error, json);
            }
            return cb(error || 'Invalid response');
        }).form(options);
    };


    // generate all API methods
    slackApiMethods.forEach(function(slackMethod) {
        // most slack api methods are only two parts, of the form group.method, e.g. auth.test
        // some have three parts: group.subgroup.method, e.g, users.profile.get
        // this method loops through all groups in a method, ensures they exist,
        // then adds the method to the terminal group

        var groups = slackMethod.split('.');
        var method = groups.pop();
        var currentGroup = slack_api;
        var nextGroupName;

        for (var i = 0; i < groups.length; i++) {
            nextGroupName = groups[i];
            if (!currentGroup[nextGroupName]) {
                currentGroup[nextGroupName] = {};
            }
            currentGroup = currentGroup[nextGroupName];
        }

        currentGroup[method] = function(options, cb) {
            slack_api.callAPI(slackMethod, options, cb);
        };

    });

    // overwrite default behavior
    slack_api.chat.postMessage = function(options, cb) {
        if (options.attachments && typeof(options.attachments) != 'string') {
            options.attachments = JSON.stringify(options.attachments);
        }
        slack_api.callAPI('chat.postMessage', options, cb);
    };

    return slack_api;
};
