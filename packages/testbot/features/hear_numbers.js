module.exports = function(controller) {

    controller.interrupts('help', 'message', async(bot, message) => {
        await bot.reply(message,'I heard you need help more than anything else.');
    });


    controller.hears(async(message) => message.text.toLowerCase() === 'foo', ['message'], async (bot, message) => {
        await bot.reply(message, 'I heard foo via a function test');
    });

    controller.hears(new RegExp(/^\d+$/), ['message','direct_message'], async function(bot, message) {
        await bot.reply(message,{ text: 'I HEARD A NUMBER' });
    });

    controller.hears(['allcaps', new RegExp(/^[A-Z]+$/)], ['message','direct_message'], async function(bot, message) {
        await bot.reply(message,{ text: 'I HEARD ALL CAPS' });
    });

 
}