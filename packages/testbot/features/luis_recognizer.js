const { LuisRecognizer } = require('botbuilder-ai');

module.exports = function(controller) {

    if (process.env.LUIS_APPLICATIONID) {

        const recognizer = new LuisRecognizer({
            applicationId: process.env.LUIS_APPLICATIONID,
            endpointKey: process.env.LUIS_ENDPOINTKEY,
        });


        controller.middleware.ingest.use(async (bot, message, next) => {
            if (message.incoming_message.type === 'message') {
                const results = await recognizer.recognize(message.context);
                message.intent = LuisRecognizer.topIntent(results, 'None', process.env.LUIS_THRESHOLD || 0.7);
                console.log('recognized',message.intent);
            }

            next();
        });

        controller.hears(async(message) => { return (message.intent && message.intent==='fart') }, 'message', async(bot, message) => {
            bot.reply(message,':dash: ew')
        });

    }

}