module.exports = function(controller) {


    controller.middleware.send.use((bot, message, next) => {

        if (Array.isArray(message.text)) {
            message.text = message.text[Math.floor(Math.random() * message.text.length)];
        }
        next();

    });

    controller.hears('random','message', async(bot, message) => { 

            bot.reply(message,{
                text: [
                    'Random response 1',
                    'Random response 2',
                    'Random response 3'
                ]
            });

    });

}