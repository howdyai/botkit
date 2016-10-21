function CreateTeam(soapbox)
{
    var soapbox = soapbox;

    this.create = function(bot, message)
    {
        var options = {
            token: bot.config.token,
            channel: message.channel
        };

        bot.api.callAPI('channels.info', options, function(command, data) {
            createUserList(message, bot, data.channel.members, function(message, bot, users, members) {
                if (users.length == members.length) {
                    sayInvites(message, bot, members);
                }
            });
        });
    }

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

    var sayInvites = function(message, bot, users)
    {
        var response = "Here's a list of people we can invite: \n";


        for (i in users) {
            response += "@" + users[i].user.name + ' ' + users[i].user.real_name + '\n';
        }

        bot.startPrivateConversation({user: message.user}, function(err, convo) {
            convo.say(response);
        });
    }

    var getUser = function(userId, bot, callback)
    {
        bot.api.callAPI('users.info', {token: bot.config.token, user: userId}, function(command, data) {
            soapbox.saveUser(data);
            callback(data);
        });

        // soapbox.loadFromCache(userId, function(userData) {
        //     if (userData !== false) {
        //         callback(userData);
        //         return;
        //     }

        //     console.log(userId);
        // });
    }
}

module.exports = CreateTeam;
