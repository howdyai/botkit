module.exports = function(controller) {

    if (controller.adapter.name === 'Websocket Adapter') {

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


    }

}