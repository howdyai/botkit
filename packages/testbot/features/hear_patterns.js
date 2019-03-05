module.exports = function(controller) {

    // hear the word help, and interrupt whatever is happening to handle it first.
    controller.interrupts('help', 'message', async(bot, message) => {
        await bot.reply(message,'I heard you need help more than anything else.');
    });

    // use a function to match a condition in the message
    controller.hears(async(message) => message.text.toLowerCase() === 'foo', ['message'], async (bot, message) => {
        await bot.reply(message, 'I heard foo via a function test');
    });

    // use a regular expression to match the text of the message
    controller.hears(new RegExp(/^\d+$/), ['message','direct_message'], async function(bot, message) {
        await bot.reply(message,{ text: 'I HEARD A NUMBER' });
    });

    // match any one of set of mixed patterns like a string, a regular expression
    controller.hears(['allcaps', new RegExp(/^[A-Z]+$/)], ['message','direct_message'], async function(bot, message) {
        await bot.reply(message,{ text: 'I HEARD ALL CAPS' });
    });

}