var CreateTeam = require('./events/CreateTeam.js');
var OnBoard = require('./events/OnBoard.js');
var AddItem = require('./events/AddItem.js');
var Reminder = require('./events/Reminder.js');

var Soapbox = function(controller) {
    var controller = controller;

    var createTeam = new CreateTeam(this);
    var onBoard = new OnBoard(this);
    var addItem = new AddItem(this);
    var reminder = new Reminder(this);

    this.listen = function()
    {
        controller.on('interactive_message_callback', function(bot, message) {
            switch(message.callback_id) {
                case 'ask_name':
                case 'ask_email':
                case 'invite_user':
                    bot.replyInteractive(message, {
                        delete_original: true
                    });
                    break;
            }

            if (message.callback_id == createTeam.getEventName()) {
                var action = message.actions[0];

                createTeam.inviteUser(action.value);
            }
        });

        controller.hears('help', ['direct_message'], function(bot, message) {
            bot.reply(message, "Here are the things I can help you do!");
            bot.reply(message, "\"hello\": Go through the initial onboarding process");
            bot.reply(message, "\"create team #<channel>\": Create 1:1s with members of that channel");
        });

        controller.hears('^create team', ['direct_message'], function(bot, message) {
            createTeam.create(bot, message);
        });

        controller.hears('^hello$', ['direct_message'], function(bot, message) {
            onBoard.initOnboard(bot, message);
        });
    }

    this.loadFromCache = function(userId, callback)
    {
        controller.storage.users.get(userId, function(err, userData) {
            if (err) {
                callback(false);
            }

            callback(userData);
        });
    }

    this.saveUser = function(data)
    {
        controller.storage.users.save(data.user, function(err) {
            if (err) {
                console.log('**Failed to write to cache');
            }
        });
    }
}

module.exports = Soapbox;
