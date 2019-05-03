module.exports = function(controller) {
    // controller.cms.before('tests','default', async function (bot, convo) {
    //     convo.vars.bar = 'foo';
    //     convo.vars.foo = 'bar';

    //     await bot.say('A');
    // });

    // controller.cms.before('tests','default', async function (bot, convo) {
    //     convo.vars.handler1 = true;
    //     convo.gotoThread('new thread');

    //     await bot.say('B');

    // });

    // controller.cms.before('tests','new thread', async function (bot, convo) {
    //     convo.vars.handler2 = 'true';
    //     convo.gotoThread('new thread 2');

    //     await bot.say('C');

    // });

    // controller.cms.onChange('tests', 'question_1', async function (bot, convo, value) {
    //     console.log('CHANGED QUESTION_1 VALUE', value);
    //     convo.vars.question_1 = 'OVERRIDDEN';
    //     convo.gotoThread('final');

    //     await bot.say('D');

    // });

    // controller.cms.after('tests', async function (bot, results) {
    //     // make sure all vars are set
    //     if (!(results.bar && results.foo && results.handler1 && results.handler2)) {
    //         throw new Error('FAILED TO AGGREGATE VARS THROUGH STEPS');
    //     }
    //     console.log('TESTS SCRIPT IS DONE!', results);

    //     await bot.say('E');

    // });

}