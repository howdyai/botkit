var SoapboxApi = require('../SoapboxApi.js');

function AddItem(soapbox)
{
    var soapbox = soapbox;
    var soapboxApi = new SoapboxApi();

    this.listen = function(controller)
    {
        // Listen to adding a meeting item
        controller.hears('^add (.*) <@[A-Z0-9]{9}>$', ['direct_message'], function(bot, message) {
            addMeetingItem(message, function(response) {
                bot.reply(message, response);
            });
        });

        // Listen to adding a channel item
        controller.hears('^add (.*)', ['direct_mention'], function(bot, message) {
            addChannelItem(message, function(response) {
                bot.reply(message, response);
            });
        });
    }

    var addMeetingItem = function(message, callback)
    {
        var item = getItemFromMessage(message);

        var meetingItem = {
            to: getMentionUser(message),
            from: message.user,
            item: item.replace(/<@[A-Z0-9]{9}>/, '')
        };

        send(meetingItem, function(response) {
            callback('Adding "' + item + '" to meeting with ' + getMentionUser(message));
        })
    }

    var addChannelItem = function(message, callback)
    {
        var channelItem = {
            to: message.channnel,
            from: message.user,
            item: getItemFromMessage(message)
        };

        send(channelItem, function(response) {
            callback('Adding: "' + getItemFromMessage(message) + '" for channel ' + message.channel);
        });
    }

    var getItemFromMessage = function(message)
    {
        return message.match[1];
    }

    var getMentionUser = function(message)
    {
        var item     = match[0];
        var userData = item.match(/<@([A-Z0-9]{9})>/);

        return userData[1];
    }

    var send = function(itemMessage, callback)
    {
        var apiMessage = {
            to: itemMessage.to || null,
            from: itemMessage.from || null,
            item: itemMessage.item || null
        }

        soapboxApi.send(itemMessage, function(response) {
            callback();
        })
    }
}

module.exports = AddItem;
