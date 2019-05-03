const Twilio = require('twilio');

module.exports = function(controller) {

    if (controller.adapter.name === 'Twilio SMS Adapter') {
        controller.on('picture_message', async(bot, message) => {
            bot.reply(message, 'Nice pic!');
        });

        controller.hears('twiml','message', async(bot, message) => {

            let twiml = new Twilio.twiml.MessagingResponse();
            twiml.message('This is a message sent using the HTTP response and TWIML');
            bot.httpBody(twiml.toString());
            
        });
    }
}