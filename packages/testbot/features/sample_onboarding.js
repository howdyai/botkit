const { BotkitConversation } = require('botkit');
const { TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');


module.exports = function(controller) {

    const ONBOARDING_PROMPT = 'onboarding_prompt';
    const PROFILE_DIALOG = 'profile_dialog';
    const ONBOARDING_DIALOG = 'onboarding_dialog';
    const CONFIRM_DIALOG = 'confirm_dialog';
    const START_OVER = 'start_over';

    /**
     * Create a TextPrompt that will be used by the profile dialog
     */
    const textPrompt = new TextPrompt(ONBOARDING_PROMPT);

    /**
     * Define a simple waterfall dialog that collects profile information.
     */
    const profile = new WaterfallDialog(PROFILE_DIALOG,[
        async(step) => {
            return await step.prompt(ONBOARDING_PROMPT, 'What is your name?');            
        },
        async(step) => {
            // capture result of previous step
            step.values.name = step.result;

            return await step.prompt(ONBOARDING_PROMPT, 'What is your age?');
        },
        async(step) => {
            // capture result of previous step
            step.values.age = step.result;

            return await step.prompt(ONBOARDING_PROMPT, 'What is your location?');
        },
        async(step) => {
            // capture result of previous step
            step.values.location = step.result;

            return await step.endDialog(step.values);
        }
    ]);

    const confirmation = new BotkitConversation(CONFIRM_DIALOG, controller);
    confirmation.say('Your name is {{vars.profile.name}}, your age is {{vars.profile.age}} and your location is {{vars.profile.location}}');
    confirmation.ask('Is that correct?', [
        {
            pattern: 'no',
            handler: async(res, convo, bot) => {
                await convo.gotoThread('try_again');
                // convo
            }
        },
        {
            default: true,
            handler: async(res, convo, bot) => {
                // noop, just continue
            }
        }
    ],{key:'confirmed'});
    confirmation.say('All done!');
    confirmation.addGotoDialog(START_OVER,'try_again');

    const startover = new BotkitConversation(START_OVER, controller);
    startover.say('Lets start from the top...');
    startover.addChildDialog(PROFILE_DIALOG, 'profile');
    startover.addGotoDialog(CONFIRM_DIALOG);

    /**
     * Now, define a BotkitConversation style dialog that will use the profile dialog as a child.
     */
    const onboarding = new BotkitConversation(ONBOARDING_DIALOG, controller);
    onboarding.say('Hello, human! Nice to meet you.');
    onboarding.say('Before we begin, I need to ask you some questions.');
    onboarding.addChildDialog(PROFILE_DIALOG, 'profile');
    onboarding.say('Thanks, {{vars.profile.name}}! Your onboarding has completed.');
    onboarding.addGotoDialog(CONFIRM_DIALOG);

    /**
     * Add all of our dialogs to the bot.
     */
    controller.addDialog(textPrompt);
    controller.addDialog(profile);
    controller.addDialog(onboarding);
    controller.addDialog(confirmation);
    controller.addDialog(startover);

    /** 
     * When the profile dialog ends, store the info!
     */
    controller.afterDialog(ONBOARDING_DIALOG, async(bot, results) => {

        if (results.confirmed != 'no') {
            console.log('PROFILE CAPTURED!', results);
            // do something like store this in the database.
        }
    });

    /**
     * listen for someone to say "onboarding" and fire the parent dialog!
     */
    controller.hears('onboarding', 'message,direct_message', async(bot, message) => {
        await bot.beginDialog(ONBOARDING_DIALOG);
    })    

}