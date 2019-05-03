module.exports = function(controller) {

    if (controller.adapter.name === 'Google Hangouts Adapter') {

        controller.on('direct_message', async(bot, message) => {
            await bot.reply(message,'I heard a private message');
        });

        controller.on('message', async(bot, message) => {
            await bot.reply(message,'I heard a public message');
        });

        controller.on('bot_room_join', async(bot, message) => {
            await bot.reply(message,'I just joined this room!');
        });

        controller.hears('thread dialog', ['message','direct_message'], async(bot, message) => {
            await bot.startConversationInThread(message.channel, message.user);
            await bot.beginDialog('waterfall_sample');
        });

        controller.hears('thread', ['message','direct_message'], async(bot, message) => {
            await bot.replyInThread(message,'This is a new thread!');
        });

        controller.hears('update', ['message','direct_message'], async(bot, message) => {
            const reply = await bot.reply(message,'This message will get updated in a few seconds.');
            setTimeout(async function() {
                await bot.updateMessage({
                    text: '[ this message was update ]',
                    id: reply.id
                });
            }, 3000);
        });

        controller.hears('delete', ['message','direct_message'], async(bot, message) => {
            const reply = await bot.reply(message,'This message will get deleted in a few seconds.');
            setTimeout(async function() {
                await bot.deleteMessage(reply);
                await bot.reply(message,'A message was deleted!');
            }, 3000);
        });


        controller.hears('cards', ['message','direct_message'], async(bot, message) => {
            bot.reply(message,{
                cards: [
                    {
                        "sections": [
                            {
                                "widgets": [
                                    {
                                        "image": { "imageUrl": "https://image.slidesharecdn.com/botkitsignal-160526164159/95/build-a-bot-with-botkit-1-638.jpg?cb=1464280993" }
                                    },
                                    {
                                        "buttons": [
                                            {
                                                "textButton": {
                                                    "text": "Open Link",
                                                    "onClick": {
                                                        "openLink": {
                                                            "url": "https://botkit.ai/docs/"
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                "textButton": {
                                                    "text": "Reply with New",
                                                    "onClick": {
                                                        "action": {
                                                            "actionMethodName": "new",
                                                            "parameters": [
                                                                {
                                                                    "key":"foo",
                                                                    "value": "bar"
                                                                }
                                                            ]
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                "textButton": {
                                                    "text": "Reply with Update",
                                                    "onClick": {
                                                        "action": {
                                                            "actionMethodName": "update",
                                                            "parameters": [
                                                                {
                                                                    "key":"foo",
                                                                    "value": "bar"
                                                                }
                                                            ]
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            })
        });

    }

    controller.on('card_clicked', async(bot, message) => {

        // send a sync reply
        if (message.action.actionMethodName === 'new') {
            await bot.replyWithNew(message, 'Card clicked, so I sent a new message.');
        } else if (message.action.actionMethodName === 'update') {
            await bot.replyWithUpdate(message, '[ This message was updated after a card click. ]');
        }

        // send a normal async reply
        await bot.reply(message,'I got a click.');

    });


    controller.hears('proactive', ['message','direct_message'], async(bot, message) => {

        // capture reference
        const reference = message.reference;
        await bot.reply(message,'I will pick this up in a little while...');

        setTimeout(async function() {

            const foo = await controller.spawn();
            await foo.changeContext(reference);
            await foo.say('OK I WAITED.');

        }, 10000);

    });
        






}