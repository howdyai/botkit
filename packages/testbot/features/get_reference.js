const { TurnContext } = require('botbuilder');

module.exports = function(controller) {

    controller.hears('reference','message', async(bot, message)=> {

        const reference = TurnContext.getConversationReference(message.incoming_message);
        await bot.reply(message, JSON.stringify(reference, null, 2));

    });

    controller.hears('thread me', 'message', async (bot, message) => {

        await bot.startConversationInThread(message.channel, message.user, message.incoming_message.channelData.ts);
        await bot.beginDialog('waterfall_sample');

    });


    controller.hears('thread it', 'message', async (bot, message) => {
        await bot.replyInThread(message,'THREADED');
    });

    controller.hears('im me', 'message', async(bot, message) => {

        await bot.startPrivateConversation(message.user);
        await bot.beginDialog('waterfall_sample')

    });


    controller.hears('webex me', 'message', async(bot, message) => {
        // switch to a 1:1
        delete message.incoming_message.conversation;
        const response = await bot.reply(message, '');
        console.log('GOT REPLY RESPONSE', response);
    });
    controller.hears('\<\#.*?\>', 'message', async(bot, message) => {

        const channel = message.text.replace(/.*?\<\#(.*?)\|.*?\>.*/,"$1");

        await bot.startConversationInChannel(channel, message.user);
        await bot.beginDialog('waterfall_sample')

    });

    // async function foo() {
    //     let bot = await controller.spawn();
    //     await bot.startPrivateConversation('U024F7C89');
    //     bot.say('I BOOTED');
    // }

    // foo();

}