module.exports = function(controller) {
    controller.on('message', async (bot, message) => {
        await bot.reply(message, { text: 'Echo: ' + message.text});

        // console.log(message);
        // console.log(JSON.stringify(message, null, 2));
    });
}