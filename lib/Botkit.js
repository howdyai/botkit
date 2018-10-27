var CoreBot = require(__dirname + '/CoreBot.js');
var Slackbot = require(__dirname + '/SlackBot.js');
var Facebookbot = require(__dirname + '/Facebook.js');
var TwilioIPMbot = require(__dirname + '/TwilioIPMBot.js');
var TwilioSMSbot = require(__dirname + '/TwilioSMSBot.js');
var BotFrameworkBot = require(__dirname + '/BotFramework.js');
var WebexBot = require(__dirname + '/WebexBot.js');
var ConsoleBot = require(__dirname + '/ConsoleBot.js');
var JabberBot = require(__dirname + '/JabberBot.js');
var WebBot = require(__dirname + '/Web.js');
var GoogleHangoutsBot = require(__dirname + '/GoogleHangoutsBot.js');
var ViberBot = require(__dirname + '/ViberBot.js');
var ViberMessageTypes = require(__dirname + '/ViberMessageTypes');

module.exports = {
    core: CoreBot,
    slackbot: Slackbot,
    webexbot: WebexBot,
    sparkbot: WebexBot, // [COMPAT] Webex rebrand, see https://github.com/howdyai/botkit/issues/1346
    facebookbot: Facebookbot,
    twilioipmbot: TwilioIPMbot,
    twiliosmsbot: TwilioSMSbot,
    botframeworkbot: BotFrameworkBot,
    teamsbot: require(__dirname + '/Teams.js'),
    consolebot: ConsoleBot,
    jabberbot: JabberBot,
    socketbot: WebBot,
    anywhere: WebBot,
    googlehangoutsbot: GoogleHangoutsBot,
    viberbot: ViberBot,
    vibermessage: ViberMessageTypes
};
