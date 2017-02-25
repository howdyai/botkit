var request = require('request');

/**
 * Does nothing. Takes no params, returns nothing. It's a no-op!
 */
function noop() {}

/**
 * Returns an interface to the Slack API in the context of the given bot
 *
 * @param {Object} bot The botkit bot object
 * @param {Object} config A config containing auth credentials.
 * @returns {Object} A callback-based Slack API interface.
 */
module.exports = function(bot, config) {

    var api_root = bot.config.api_root ? bot.config.api_root : 'https://slack.com';

    var slack_api = {
        api_url: api_root + '/api/'
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
        'channels.replies',
        'channels.setPurpose',
        'channels.setTopic',
        'channels.unarchive',
        'chat.delete',
        'chat.postMessage',
        'chat.update',
        'dnd.endDnd',
        'dnd.endSnooze',
        'dnd.info',
        'dnd.setSnooze',
        'dnd.teamInfo',
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
        'reminders.add',
        'reminders.complete',
        'reminders.delete',
        'reminders.info',
        'reminders.list',
        'rtm.start',
        'search.all',
        'search.files',
        'search.messages',
        'stars.add',
        'stars.list',
        'stars.remove',
        'team.accessLogs',
        'team.info',
        'users.getPresence',
        'users.info',
        'users.list',
        'users.setActive',
        'users.setPresence'
    ];

    /**
     * Calls Slack using a Token for authentication/authorization
     *
     * @param {string} command The Slack API command to call
     * @param {Object} data The data to pass to the API call
     * @param {function} cb A NodeJS-style callback
     */
    slack_api.callAPI = function(command, data, cb, multipart) {
        if (!data.token) {
            data.token = config.token;
        }

        bot.debug(command, data);
        postForm(slack_api.api_url + command, data, cb, multipart);
    };

    /**
     * Calls Slack using OAuth for authentication/authorization
     *
     * @param {string} command The Slack API command to call
     * @param {Object} data The data to pass to the API call
     * @param {function} cb A NodeJS-style callback
     */
    slack_api.callAPIWithoutToken = function(command, data, cb) {
        if (!data.client_id) {
            data.client_id = bot.config.clientId;
        }
        if (!data.client_secret) {
            data.client_secret = bot.config.clientSecret;
        }
        if (!data.redirect_uri) {
            data.redirect_uri = bot.config.redirectUri;
        }

        // DON'T log options: that could expose the client secret!
        postForm(slack_api.api_url + command, data, cb);
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

        groups.forEach(function(nextGroupName) {
            if (!currentGroup[nextGroupName]) {
                currentGroup[nextGroupName] = {};
            }
            currentGroup = currentGroup[nextGroupName];
        });

        currentGroup[method] = function(options, cb) {
            slack_api.callAPI(slackMethod, options, cb);
        };

    });

    // overwrite default behavior
    slack_api.chat.postMessage = function(options, cb) {
        sanitizeOptions(options);
        slack_api.callAPI('chat.postMessage', options, cb);
    };

    slack_api.chat.update = function(options, cb) {
        sanitizeOptions(options);
        slack_api.callAPI('chat.update', options, cb);
    };

    // specify that files get uploaded using multipart
    slack_api.files.upload = function(options, cb) {
        if (options.file) {
            slack_api.callAPI('files.upload', options, cb, true);
        } else {
            slack_api.callAPI('files.upload', options, cb, false);
        }
    };

    function sanitizeOptions(options) {
        if (options.attachments && typeof(options.attachments) != 'string') {
            try {
                options.attachments = JSON.stringify(options.attachments);
            } catch (err) {
                delete options.attachments;
                bot.log.error('Could not parse attachments', err);
            }
        }
    }


    return slack_api;


    /**
     * Makes a POST request as a form to the given url with the options as data
     *
     * @param {string} url The URL to POST to
     * @param {Object} formData The data to POST as a form
     * @param {function=} cb An optional NodeJS style callback when the POST completes or errors out.
     */
    function postForm(url, formData, cb, multipart) {
        cb = cb || noop;

        bot.log('** API CALL: ' + url);
        var params = {
            url: url,
            headers: {
                'User-Agent': bot.userAgent(),
            }
        };

        if (multipart === true) {
            params.formData = formData;
        } else {
            params.form = formData;
        }

        request.post(params, function(error, response, body) {
            bot.debug('Got response', error, body);
            if (!error && response.statusCode == 200) {
                var json;
                try {
                    json = JSON.parse(body);
                } catch (parseError) {
                    return cb(parseError);
                }

                if (json.ok) {
                    return cb(null, json);
                }
                return cb(json.error, json);
            }
            return cb(error || new Error('Invalid response'));
        });
    }
};
