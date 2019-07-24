const { BotkitConversation } = require('botkit');

module.exports = function(controller) {


    // yes runs normally before it starts
    // yes runs when using an action
    // yes calls when looping itself
    // yes runs when a handler is passed in as a function and inside it calls convo.gotothread
    // runs when an onchange handler calls gotothread
    // yes runs in an onbefore

    let convo = new BotkitConversation('test_convo', controller);
    controller.addDialog(convo);

    convo.before('default', async(convo, bot) => {
        await bot.say('BEFORE DEFAULT!');
        convo.setVar('count', 0);
    });

    convo.say('This is the default thread.');
    convo.addAction('second');

    convo.before('second', async(convo, bot) => { 
        await bot.say('BEFORE SECOND');
        convo.setVar('count', convo.vars.count + 1);
        if (convo.vars.count > 2) {
            await convo.gotoThread('third');
        }
    });
    convo.addMessage('This is the second thread round {{vars.count}}', 'second');
    convo.addAction('second','second');

    convo.before('third', async(convo, bot) => {
        await bot.say('BEFORE THIRD');
    });

    convo.addMessage('This is third','third');
    convo.addQuestion('What do you think', async(response, convo, bot) => {
        await convo.gotoThread('fourth');
    }, 'think', 'third');

    convo.before('fourth', async(convo, bot) => {
        await bot.say('BEFORE FOURTH!!!');
    });
    convo.addMessage('this is the fourth thread', 'fourth');
    convo.addQuestion('Will this work?', [], 'work', 'fourth');

    convo.onChange('work', async(response, convo, bot) => {
        await convo.gotoThread('fifth');
    });

    convo.before('fifth', async(convo, bot) => {
        await bot.say('BEFORE FIFTH!!!');
    });
    convo.addMessage('this is the fifth thread','fifth');
    convo.addAction('default', 'fifth');




    controller.hears('convo_test', 'direct_message,message', async(bot, message) => { 
        await bot.beginDialog('test_convo');
    });

}