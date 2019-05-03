import { Botkit } from 'botkit';
import { SlackBotWorker } from 'botbuilder-slack';

module.exports = function(controller: Botkit) {

    controller.on('direct_message', async(bot: SlackBotWorker, message: any): Promise<boolean> => {

        // intellisene!
        bot.reply(message, { text: 'foo' });

        // stop processing this message once received here.
        return false;
    });


}