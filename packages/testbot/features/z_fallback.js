const { BotkitConversation } = require('botkit');
module.exports = function(controller) {

    let convo = new BotkitConversation('poot', controller);
    controller.addDialog(convo);

    convo.ask('Hey what is up yo',[], 'up');
    convo.after(async(results, bot) => {
        console.log('RESULTS', results);
    });

    controller.on('message', async (bot, message) => {
        await bot.beginDialog('poot');
        // await bot.reply(message, { text: 'Echo: ' + message.text});
    });
}