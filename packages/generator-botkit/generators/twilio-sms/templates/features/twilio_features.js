/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const Twilio = require('twilio');

module.exports = function(controller) {

    controller.on('picture_message', async(bot, message) => {
        bot.reply(message, 'Nice pic!');
    });

    controller.hears('twiml','message', async(bot, message) => {

        let twiml = new Twilio.twiml.MessagingResponse();
        twiml.message('This is a message sent using the HTTP response and TWIML');
        bot.httpBody(twiml.toString());
        
    });

}