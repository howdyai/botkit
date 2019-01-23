module.exports = function(controller) {

    controller.on('interactive_message', async (bot, message) => {
        bot.api.dialog.open({
            trigger_id: message.incoming_message.channelData.trigger_id,
            dialog: {
                'callback_id': '1235',
                'title': 'Sample Dialog',
                'submit_label': 'Submit',
                'notify_on_cancel': true,
                'state': 'botkit rules',
                'elements': [
                    {
                        'type': 'text',
                        'label': 'Field 1',
                        'name': 'field1'
                    },
                    {
                        'type': 'text',
                        'label': 'Field 2',
                        'name': 'field2'
                    }
                ]
            }
        });
    });

    controller.on('dialog_submission', async (bot, message) => {
        await bot.reply(message, 'Got a dialog submission');
    });

    controller.on('dialog_cancellation', async (bot, message) => {
        await bot.reply(message, 'Got a dialog cancellation');
    });


}