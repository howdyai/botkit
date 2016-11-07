var CoreBot = require(__dirname + '/CoreBot.js');
var Slackbot = require(__dirname + '/SlackBot.js');
var Facebookbot = require(__dirname + '/Facebook.js');
var TwilioIPMbot = require(__dirname + '/TwilioIPMBot.js');
var BotFrameworkBot = require(__dirname + '/BotFramework.js');
var ConsoleBot = require(__dirname + '/ConsoleBot.js');

module.exports = {
    core: CoreBot,
    slackbot: Slackbot,
    facebookbot: Facebookbot,
    twilioipmbot: TwilioIPMbot,
    botframeworkbot: BotFrameworkBot,
    consolebot: ConsoleBot,
};
