function CreateTeam(soapbox)
{
    var soapbox = soapbox;

    var INVITE_USER_EVENT = 'invite_user';

    /**
     * Start the team creation process
     *
     * @access public
     * @param  object bot
     * @param  object message
     * @return void
     */
    this.create = function(bot, message)
    {
        var channelId = parseChannelId(message);

        if (channelId !== false) {
            var options = {
                token: bot.config.token,
                channel: channelId
            };

            bot.api.callAPI('channels.info', options, function(command, data) {
                createUserList(message, bot, data.channel.members, function(message, bot, users, members) {
                    if (users.length == members.length) {
                        sayInvites(message, bot, members);
                    }
                });
            });
        } else {
            bot.reply(message, "I'm sorry, that's not a valid team =(");
        }
    }

    /**
     * Strip the channel id from a Slack channel tag
     *
     * @access private
     * @param  object message
     * @return string if found, false if now
     */
    var parseChannelId = function(message)
    {
        if (message && message.match && message.match['input']) {
            var channelTag = message.match['input'].match(/<#[A-Z0-9]{9}\|\w*>$/gm);

            if (channelTag != null && channelTag[0]) {
                channelId = channelTag[0].match(/^<#([A-Z0-9]{9})\|\w*>$/);

                return channelId !== null && channelId[1] ? channelId[1] : false;
            }
        }

        return false;
    }

    /**
     * Create a list of users
     *
     * @access private
     * @param  object   message
     * @param  object   bot
     * @param  array   users
     * @param  function callback
     * @return void
     */
    var createUserList = function(message, bot, users, callback)
    {
        var members = [];

        for (i in users) {
            getUser(users[i], bot, function(data) {
                members.push(data);

                callback(message, bot, users, members);
            });
        }
    }

    /**
     * Respond with the list of users
     *
     * @access private
     * @param  object message
     * @param  object bot
     * @param  array users
     * @return void
     */
    var sayInvites = function(message, bot, users)
    {
        var response = {
            text: "Here's a list of users we can invite: ",
            attachments: []
        };


        for (i in users) {
            user = users[i].user;

            if (user.is_bot)
                continue;

            response.attachments.push({
                title: "@" + user.name + ' ' + user.real_name,
                callback_id: INVITE_USER_EVENT,
                attachment_type: 'default',
                actions: [
                    {
                        name: 'invite',
                        text: 'Invite to 1:1',
                        value: user.id,
                        type: 'button'
                    }
                ]
            });
        }

        bot.startPrivateConversation({user: message.user}, function(err, convo) {
            convo.say(response);
        });
    }

    /**
     * Get information about a user
     *
     * @access private
     * @param  string   userId
     * @param  object   bot
     * @param  function callback
     * @return void
     */
    var getUser = function(userId, bot, callback)
    {
        bot.api.callAPI('users.info', {token: bot.config.token, user: userId}, function(command, data) {
            soapbox.saveUser(data);
            callback(data);
        });

        // TODO: probably do some caching magic
        // soapbox.loadFromCache(userId, function(userData) {
        //     if (userData !== false) {
        //         callback(userData);
        //         return;
        //     }

        //     console.log(userId);
        // });
    }

    this.inviteUser = function(userId)
    {
        console.log('Inviting: ' + userId);
    }

    this.getEventName = function()
    {
        return INVITE_USER_EVENT;
    }
}

module.exports = CreateTeam;
