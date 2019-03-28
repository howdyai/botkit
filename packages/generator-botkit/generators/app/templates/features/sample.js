module.exports = function(controller) {

    controller.hears('sample','message', async(bot, message) => {
        bot.reply(message, 'I heard a sample message.');
    });

}