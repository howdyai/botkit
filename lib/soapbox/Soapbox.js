var CreateTeam = require('./events/CreateTeam.js');
var OnBoard    = require('./events/OnBoard.js');
var AddItem    = require('./events/AddItem.js');
var Reminder   = require('./events/Reminder.js');

var Soapbox = function(controller, webserver) {
    var controller = controller;
    var webserver  = webserver;
    var createTeam = new CreateTeam(this);
    var onBoard    = new OnBoard(this);
    var addItem    = new AddItem(this);
    var reminder   = new Reminder(this);

    this.listen = function()
    {
        onBoard.listen(controller);
        addItem.listen(controller);
        createTeam.listen(controller);
        reminder.listen(controller);

        controller.hears('help', ['direct_message'], function(bot, message) {
            bot.reply(message, "Here are the things I can help you do!");
            bot.reply(message, "\"hello\": Go through the initial onboarding process");
            bot.reply(message, "\"create team #<channel>\": Create 1:1s with members of that channel");
            bot.reply(message, "\"add <item> @<user>\": Add a meeting item to your next meeting with @<user>");
            bot.reply(message, "In a channel: \"add <item>\": Add a meeting item to the next meeting with that channel");
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

    this.getWebserver = function()
    {
        return webserver;
    }
}

module.exports = Soapbox;
