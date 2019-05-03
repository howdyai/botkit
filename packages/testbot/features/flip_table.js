const request = require('request');
module.exports = function(controller) {

    controller.hears(['flip'], 'message', async (bot, message) => {
        request.get('http://www.tableflipper.com/json', (e, r, json) => {
            const url = JSON.parse(json);
            bot.reply(message,url.gif);
        });
    });
}