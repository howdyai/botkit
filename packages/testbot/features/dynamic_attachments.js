const { BotkitConversation } = require('botkit');

module.exports = function(controller) {

    let dialog = new BotkitConversation('dynamic_attachments', controller);   
    dialog.ask({
        text: 'What is your name?',
        quick_replies: [
            {
                title: '{{vars.default_name}}',
                payload: '{{vars.default_name}}',
            }
        ]
    }, [], 'name');

    dialog.ask({
        text: 'Your name is:',
        quick_replies: async(line, vars) => {
            return [
                {
                    title: 'Foo',
                    payload: 'foo',
                },
                {
                    title: 'Bar',
                    payload: 'bar',
                },
                {
                    title: vars.name,
                    payload: vars.name
                }
            ]
        }
    }, [], 'menu');

    dialog.say({
        text: 'Does this sound right?',
        attachments: async(line, vars) => {
            return [
                {
                    title: `Your name is ${vars.name} and you chose ${vars.menu}`
                }
            ];
        }
    });
    controller.addDialog(dialog);

    controller.hears('dynamic', 'message,direct_message,direct_mention', async(bot, message) => {
        await bot.beginDialog('dynamic_attachments', {default_name: 'BEN'});
    });

}