var CoreBot = require(__dirname + '/CoreBot.js');
var Slackbot = require(__dirname + '/SlackBot.js');
var Facebookbot = require(__dirname + '/Facebook.js');
var TwilioIPMbot = require(__dirname + '/TwilioIPMBot.js');
var TwilioSMSbot = require(__dirname + '/TwilioSMSBot.js');
var BotFrameworkBot = require(__dirname + '/BotFramework.js');
var SparkBot = require(__dirname + '/CiscoSparkbot.js');
var ConsoleBot = require(__dirname + '/ConsoleBot.js');
var JabberBot = require(__dirname + '/JabberBot.js');
var WebBot = require(__dirname + '/Web.js');

module.exports = {
    core: CoreBot,
    slackbot: Slackbot,
    sparkbot: SparkBot,
    facebookbot: Facebookbot,
    twilioipmbot: TwilioIPMbot,
    twiliosmsbot: TwilioSMSbot,
    botframeworkbot: BotFrameworkBot,
    teamsbot: require(__dirname + '/Teams.js'),
    consolebot: ConsoleBot,
    jabberbot: JabberBot,
    socketbot: WebBot,
    anywhere: WebBot,
};
