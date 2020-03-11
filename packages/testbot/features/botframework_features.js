const request = require('request');

module.exports = function(controller) {

    if (!controller.adapter.name) {

        controller.hears('dm me', 'message', async(bot, message) => {
            // this does not work with Bot Framework Emulator.
            // to achieve the same thing, use bot.changeContext(message.reference);
            await bot.startConversationWithUser(message.reference);
            await bot.say('Hello! (in private)');
        });

        controller.hears('update me', 'message', async(bot, message) => {

            let reply = await bot.reply(message,'reply');
            await controller.adapter.updateActivity(bot.getConfig('context'), {
                text: 'UPDATED!',
                ...message.incoming_message,
                ...reply
            });

        })


        controller.hears('delete me', 'message', async(bot, message) => {

            let reply = await bot.reply(message,'delete this!');

            await controller.adapter.deleteActivity(bot.getConfig('context'), {
                ...message.incoming_message,
                activityId: reply.id
            });

        });

        controller.hears('members', 'message', async(bot, message) => {

            let members = await controller.adapter.getConversationMembers(bot.getConfig('context'));
            await bot.reply(message,JSON.stringify(members));

        });

        controller.hears('conversations', 'message', async(bot, message) => {

            let channels = await controller.adapter.getChannels(bot.getConfig('context'));
            await bot.reply(message, JSON.stringify(channels));

        });

        controller.hears('card', 'message', async(bot, message) => {

            await bot.reply(message,{
                attachments: [{
                    "contentType": "application/vnd.microsoft.card.hero",
                    "content": {
                        "buttons": [
                            {
                                "type": "imBack",
                                "title": "say hey",
                                "value": "hey"
                            },
                            {
                                "type": "imBack",
                                "title": "say what up",
                                "value": "what up"
                            },
                            {
                                "type": "invoke",
                                "title": "invoke",
                                "value": {command: 'alpha'}
                            }
                        ],
                        "subtitle": "subtitle is this",
                        "text": "text of cards",
                        "title": "this is the card"
                    }
                }]
            });

        });

        controller.on('invoke', async(bot, message) => {

            // make sure to send back a special invoke response.
            // depends on the type of invoke!
            await bot.reply(message,{
                type: 'invokeResponse',
                value: {
                    status: 200,
                    body: {},
                }
            });

            console.log('***************************************************************************');
            console.log(JSON.stringify(message, null, 2));
            console.log('***************************************************************************');
            await bot.reply(message, 'Got it: ' + JSON.stringify(message.value));
        });

    }
}