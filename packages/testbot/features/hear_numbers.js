module.exports = function(controller) {
    controller.hears(['^\\d+$'], ['message','direct_message'], async function(bot, message) {
        await bot.reply(message,{ text: 'I HEARD A NUMBER' });
    });
}