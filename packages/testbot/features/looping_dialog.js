const { BotkitConversation } = require('botkit');

module.exports = function(controller) {

    let dialog = new BotkitConversation('looping', controller);

    // define the questions in a variable
    dialog.before('default', async(convo, bot) => {
        // set list of questions
        convo.setVar('questions', ['What is your name?','What is your quest?', 'What is the airspeed of an unladen swallow?']);
        convo.setVar('question_index', 0);
    });

    // start off with an intro message
    dialog.say('I have some questions for you...');
    // start the loop
    dialog.addAction('question-loop');

    dialog.before('question-loop', async(convo, bot) => {

        if (convo.vars.question_index < convo.vars.questions.length) {
            convo.setVar('question', convo.vars.questions[convo.vars.question_index]);
        } else {
            await convo.gotoThread('end');
        }

    });

    // use a variable for the question text:
    dialog.addQuestion('{{vars.question}}', async(response, convo, bot) => {

        // capture in answer_x
        let key = 'answer_' + convo.vars.question_index;
        convo.setVar(key, response);
        convo.setVar('question_index', convo.vars.question_index + 1);

    }, 'answer','question-loop');
    dialog.addAction('question-loop', 'question-loop');

    dialog.addMessage('ALL DONE!', 'end');

    dialog.after(async(results, bot) => {
         console.log('RESULTS OF LOOPING DIALOG', results);
    });

    controller.addDialog(dialog);

    controller.hears('loop', 'message,direct_message', async(bot, message) => {
        await bot.beginDialog('looping');
    });


}