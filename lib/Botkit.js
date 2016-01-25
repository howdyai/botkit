var CoreBot = require(__dirname + '/CoreBot.js');
var Slackbot = require(__dirname + '/SlackBot.js');
var Smoochbot = require(__dirname + '/SmoochBot.js');

module.exports = {
    core: CoreBot,
    slackbot: Slackbot,
    smoochbot: Smoochbot
};
