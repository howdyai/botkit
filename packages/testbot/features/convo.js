const { BotkitConversation } = require('botkit');

const welcome = new BotkitConversation('dynamic');

welcome.say('Hey!');
welcome.say('What is up??');
welcome.ask('what is your name', async (answer, dc, step) => {
    console.log('INSIDE ASK HANDLER');
},{key: 'name'});
welcome.say('hrrm');
welcome.say('ok {{vars.name}}');
welcome.ask('yes or no', [
    {
        pattern: 'yes',
        handler: async function(answer, dc, step) {
            console.log('YES HANDLER');
            return await this.gotoThread('foo', dc, step);
        }
    },
    {
        pattern: 'no',
        handler: async function(answer, dc, step) { 
            console.log(' NO HANDLER');
            return await this.gotoThread('bar', dc, step);
        }
    },
    {
        default: true,
        handler: async (answer, dc, step) => {
            console.log('FALLBACK HANDLER');
            // do nothing
        }
    }
], {key: 'answer'});

welcome.say('HUH WHAT DOES {{vars.answer}} MEAN?');

welcome.addMessage('YES!!!','foo');
welcome.addMessage('NOOOOOO', 'bar');

module.exports = function(controller) {

    controller.dialogSet.add(welcome);
    controller.hears(['welcome'],'message', async (bot, message) => { 
        await bot.beginDialog('dynamic'); 
    })

}