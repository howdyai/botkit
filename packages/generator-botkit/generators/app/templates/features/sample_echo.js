module.exports = function(controller) {

    controller.hears('sample','message', async(bot, message) => {
        await bot.reply(message, 'I heard a sample message.');
    });

    controller.on('message', async(bot, message) => {
        await bot.reply(message, `Echo: ${ message.text }`);
    });

}