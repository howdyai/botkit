const { BotkitConversation} = require('botkit');

module.exports = function(controller) {

    const dialog = new BotkitConversation('HELPDIALOG', controller);

    dialog.ask('What can I help with?', [], 'subject');
    dialog.say('HRRM! What do I know about {{vars.subject}}?');
    dialog.addAction('display_results');

    dialog.before('display_results', async(convo, bot) => {
        convo.setVar('results', 'KNOWLEDGE BASE EMPTY');
    });

    dialog.addMessage('Here is what I know: {{vars.results}}', 'display_results');

    controller.addDialog(dialog);

    // hear the word help, and interrupt whatever is happening to handle it first.
    controller.interrupts(async(message) => { return message.intent==='help' }, 'message', async(bot, message) => {
        await bot.reply(message,'I heard you need help more than anything else!');
        await bot.beginDialog('HELPDIALOG');
    });


    controller.interrupts(['quit','cancel'], 'message', async (bot, message) => {

        await bot.reply(message,'LETS QUIT THIS JUNK!');
        await bot.cancelAllDialogs();
    });


}