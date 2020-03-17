const { BotkitConversation } = require('botkit');

module.exports = function(controller) {

    if (controller.adapter.name === 'Web Adapter') {

        console.log('Loading sample Websocket features...');

        controller.publicFolder('/',__dirname  + '/../public');

        /**
         * Send a message to new users / people with no user id cookie set
         */
        controller.on('hello', async(bot, message) => {
            await bot.reply(message,'Nice to meet you, human!');
        });

        /**
         * Send a message to returning users
         */
        controller.on('welcome_back', async(bot, message) => {
            await bot.reply(message,'Welcome back, human.');
        });


        /** 
         * demo the use of the quick reply feature
         */
        controller.hears(new RegExp('quick'), 'message', async (bot, message) => {


            await bot.reply(message,{
                text: 'Here are some quick replies',
                quick_replies: [
                    {
                        title: 'Foo',
                        payload: 'foo',
                    },
                    {
                        title: 'Bar',
                        payload: 'bar',
                    }
                ]
            });
        });

        let typing = new BotkitConversation('typing', controller);

        typing.say('I am going to type for a while now...');
        typing.addAction('typing');
    
        // start the typing indicator
        typing.addMessage({type: 'typing'}, 'typing');
        // trigger a gotoThread, which gives us an opportunity to delay the next message
        typing.addAction('next_thread','typing');
    
        typing.addMessage('typed!','next_thread');
    
       // use the before handler to delay the next message 
        typing.before('next_thread',  async() => {
            return new Promise((resolve, reject) => {
                // simulate some long running process
                setTimeout(resolve, 3000);
            });
        });
    
        controller.addDialog(typing);
    
        controller.hears('typing dialog', 'message', async(bot, message) => {
            await bot.beginDialog('typing');
        });

        controller.hears('typing reply', 'message', async(bot, message) => {

            await bot.reply(message, {type: 'typing'});
    
            setTimeout(async () => {
                // will have to reset context because turn has now ended.
                await bot.changeContext(message.reference);
                await bot.reply(message, 'Typed!');
            }, 1000);
    
        });

        let replies = new BotkitConversation('replies', controller);
        replies.ask({
            text: 'Click one of these suggestions!',
            quick_replies: [
                {
                    title: 'Foo',
                    payload: 'foo',
                },
                {
                    title: 'Bar',
                    payload: 'bar',
                }
            ]
        }, [], 'reply');
        replies.say('You clicked {{vars.reply}}');
        replies.ask({
            text: 'Click one of these suggestions!',
            quick_replies: [
                {
                    title: 'Norm',
                    payload: 'norm',
                },
                {
                    title: 'Flarm',
                    payload: 'flarm',
                }
            ]
        }, async(response, convo, bot, message) => {
            console.log('GOT REPLY', response);
            console.log('FULL PAyLOAD',message);
        }, 'reply');
        replies.say('You clicked {{vars.reply}}');

        controller.addDialog(replies);

        controller.hears('qqq', 'message', async(bot, message) => {
            await bot.beginDialog('replies');
        });





    }

}