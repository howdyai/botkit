const fetch = require('cross-fetch');
module.exports = function(controller) {

    controller.hears(['flip'], 'message', async (bot, message) => {
        fetch('http://www.tableflipper.com/json').then(resp => resp.text).then(json => {
            const url = JSON.parse(json);
            bot.reply(message, url.gif);
        });
    });
}