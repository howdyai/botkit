module.exports = function(controller) {


    controller.interrupts(['quit','cancel'], 'message', async (bot, message) => {

        await bot.reply(message,'LETS QUIT THIS JUNK!');
        // bot.cancelAllDialogs();
    });


}