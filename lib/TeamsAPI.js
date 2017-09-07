var request = require('requestretry');

module.exports = function(configuration) {

    var api = {

        request: function(options, cb) {

            if (!options.headers) {
                options.headers = {
                    'content-type': 'application/json',
                    Authorization: 'Bearer ' + configuration.token
                };
            }

            request(options, function(err, res, body) {

                if (err && cb) {
                    return cb(err);
                }
                if (!body) {
                    if (cb) { return cb('Error parsing json response'); }
                }

                if (body.error) {
                    if (cb) { return cb(body.error); }
                }

                if (cb) { cb(null, body); }

            });
        },
        createConversation: function(data, cb) {
            var uri = configuration.serviceUrl + 'v3/conversations';
            api.request({
                method: 'POST',
                json: true,
                body: data,
                uri: uri
            }, cb);
        },
        updateMessage: function(conversationId, messageId, replacement, cb) {

            var uri = configuration.serviceUrl + 'v3/conversations/' + encodeURIComponent(conversationId) + '/activities/' + encodeURIComponent(messageId);

            api.request(
              {
                method: 'PUT',
                json: true,
                body: replacement,
                uri: uri
            }, cb
            );

        },
        addMessageToConversation: function(conversationId, message, cb) {

            var uri = configuration.serviceUrl + 'v3/conversations/' + conversationId + '/activities';

            api.request(
            {
                method: 'POST',
                json: true,
                body: message,
                uri: uri
            }, cb);

        },
        getChannels: function(teamId, cb) {

            var uri = configuration.serviceUrl + 'v3/teams/' + teamId + '/conversations/';
            api.request({
                method: 'GET',
                json: true,
                uri: uri
            }, function(err, list) {
                if (err) {
                    cb(err);
                } else {
                    for (var c = 0; c < list.conversations.length; c++) {
                        if (list.conversations[c].id == teamId) {
                            list.conversations[c].name = 'General';
                        }
                    }
                    cb(null, list.conversations);
                }
            });

        },
        getUserById: function(conversationId, userId, cb) {
            api.getTeamRoster(conversationId, function(err, roster) {
                if (err) {
                    return cb(err);
                } else {
                    for (var u = 0; u < roster.length; u++) {
                        if (roster[u].id == userId) {
                            return cb(null, roster[u]);
                        }
                    }
                }

                cb('User not found');

            });
        },
        getUserByUpn: function(conversationId, upn, cb) {
            api.getTeamRoster(conversationId, function(err, roster) {
                if (err) {
                    return cb(err);
                } else {
                    for (var u = 0; u < roster.length; u++) {
                        if (roster[u].userPrincipalName == upn) {
                            return cb(null, roster[u]);
                        }
                    }
                }
                cb('User not found');
            });
        },
        getConversationMembers: function(conversationId, cb) {

            var uri = configuration.serviceUrl + 'v3/conversations/' + conversationId + '/members/';
            api.request({
                method: 'GET',
                json: true,
                uri: uri
            }, cb);

        },
        getTeamRoster: function(conversation_id, cb) {

            var uri = configuration.serviceUrl + 'v3/conversations/' + conversation_id + '/members/';
            api.request({
                method: 'GET',
                json: true,
                uri: uri
            }, cb);

        },
        getToken: function(cb) {
            request(
              {
                uri: 'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token',
                form: {
                    grant_type: 'client_credentials',
                    client_id: configuration.clientId,
                    client_secret: configuration.clientSecret,
                    scope: 'https://api.botframework.com/.default'
                }
            },
              function(err, res, body) {
                if (err) {
                    cb(err);
                } else {
                    var json = null;
                    try {
                        var json = JSON.parse(body);
                    } catch (err) {
                        return cb(err);
                    }
                    if (json.error) {
                        return cb(json.error_description);
                    }
                    configuration.token = json.access_token;
                    cb(null);
                }
            }
            );
        },


    };

    return api;

};
