module.exports = function(controller) {

    // hear the word help, and interrupt whatever is happening to handle it first.
    controller.interrupts(async(message) => { return message.intent==='help' }, 'message', async(bot, message) => {
        await bot.reply(message,'I heard you need help more than anything else!');
    });


    controller.interrupts(['quit','cancel'], 'message', async (bot, message) => {

        await bot.reply(message,'LETS QUIT THIS JUNK!');
        // bot.cancelAllDialogs();
    });


}