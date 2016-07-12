/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node slack_bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');

var controller = Botkit.slackbot({
    debug: false,
});

var bot = controller.spawn({
    token: process.env.token,
    howdy_token: process.env.howdy_token,
    howdy_bot_id: process.env.howdy_bot_id
});

bot.team_info = {
    id: 'T800',
}

bot.identity = {
    id: 'Arnold',
}

function randomChannel() {

    var chans = ['C123','C234','C346','C454'];
    return chans[Math.floor(Math.random() * chans.length)];

}

function randomCommand() {

    var chans = ['help','hello','goodbye','thanks','shut up'];
    return chans[Math.floor(Math.random() * chans.length)];

}

function randomStatus() {

    var chans = ['completed','timeout','ended'];
    return chans[Math.floor(Math.random() * chans.length)];

}



function randomUser() {

    return 'U' + Math.floor(Math.random()*100);

}




function commandStat() {

    var now = new Date().getTime();

    now = now - Math.floor(Math.random() * (86400 * 1000 * 90));

    controller.trigger('remote_command_end', [bot, {channel: randomChannel(), user: randomUser(), now: new Date(now)}, {timestamp: now, command: randomCommand()},{status: randomStatus(), lastActive: 10, startTime:5}]);

}

for (var i = 0; i < 5000; i++) {
    commandStat();
}
