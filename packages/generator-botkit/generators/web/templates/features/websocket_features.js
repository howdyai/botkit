module.exports = function(controller) {

    if (controller.adapter.name === 'Web Adapter') {

        console.log('Loading sample web features...');

        controller.hears(new RegExp('quick'), 'message', async (bot, message) => {

            await bot.reply(message,{
                text: 'Here are some quick replies',
                quick_replies: [
                    {
                        text: 'Foo',
                        payload: 'foo',
                    },
                    {
                        text: 'Bar',
                        payload: 'bar',
                    }
                ]
            });
        });


    }

}