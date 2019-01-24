let files = {
    core: 'CoreBot.js',
    slackbot:  'SlackBot.js',
    facebookbot:  'Facebook.js',
    webexbot:     'WebexBot.js',
    sparkbot:     'WebexBot.js', // [COMPAT] Webex rebrand, see https://github.com/howdyai/botkit/issues/1346
    twilioipmbot: 'TwilioIPMBot.js',
    twiliosmsbot:  'TwilioSMSBot.js',
    botframeworkbot: 'BotFramework.js',
    consolebot: 'ConsoleBot.js',
    jabberbot: 'JabberBot.js',
    socketbot: 'Web.js',
    anywhere: 'Web.js',
    teamsbot: 'Teams.js',
    googlehangoutsbot: 'GoogleHangoutsBot.js'
};
module.exports = (options => {
    if (typeof(options) == 'undefined') {
        options = {};
    }
    let exports = {};
    for (let k in files) {
        if (options[k] != undefined) {
            exports[k] = options[k];

        } else {
            exports[k] = require(__dirname + '/' + files[k]);
        }
    }
    return exports;
})(global.botkitOptions);
