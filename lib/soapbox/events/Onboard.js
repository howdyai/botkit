function OnBoard(soapbox)
{
    var soapbox = soapbox;

    var usename, firstName, lastName, email;

    var CONVO_COMPLETED    = 'completed';
    var CONVO_STOPPED      = 'stopped';
    var CONVO_TIMEOUT      = 'timeout';
    var CONVO_TIMEOUT_TIME = 10000;
    var ASK_NAME_EVENT     = 'ask_name';
    var ASK_EMAIL_EVENT    = 'ask_email';

    /**
     * Listen for onboarding events
     *
     * @param  object controller]
     * @return void
     */
    this.listen = function(controller)
    {
        controller.on('interactive_message_callback', function(bot, message) {
            switch(message.callback_id) {
                case ASK_NAME_EVENT:
                case ASK_EMAIL_EVENT:
                    bot.replyInteractive(message, {
                        delete_original: true
                    });
                    break;
            }
        });

        controller.hears('^hello$', ['direct_message'], function(bot, message) {
            initOnboard(bot, message);
        });
    }

    /**
     * Initialize the onboarding conversation
     *
     * @access private
     * @return void
     */
    var initOnboard = function(bot, message)
    {
       bot.api.users.info({user: message.user}, (error, response) => {
            bot.startConversation(message, function(err, convo) {
                convo.setTimeout(CONVO_TIMEOUT_TIME);
                convo.on('end', function(convo) {
                    // Do something with responses
                    var values = convo.extractResponses();

                    switch(convo.status) {
                        case CONVO_COMPLETED:
                            console.log('Completed!');
                            break;
                        case CONVO_STOPPED:
                            console.log('Stopped');
                            break;
                        case CONVO_TIMEOUT:
                        default:
                            bot.reply(message, 'Tired of waiting...');
                    }
                });

                username  = response.user.name;
                firstName = response.user.profile.first_name;
                lastName  = response.user.profile.last_name;
                email     = response.user.profile.email;

                hello(convo);
            });
        });
    }

    /**
     * Step 1: Hello blurb
     *
     * @access private
     * @param  object convo the conversation object
     * @return void
     */
    var hello = function(convo)
    {
        convo.say('Hello @' + username + '! Thanks for installing Vee5ive.');
        convo.say('First, let me confim a few things to make sure I have your information.');

        askName(convo);
        convo.next();
    }

    /**
     * Step 2: Validate the users name
     *
     * @access private
     * @param  object convo the conversation object
     * @return void
     */
    var askName = function(convo)
    {
        convo.ask({
            attachments: [
                {
                    title: 'Is your full name ' + firstName + ' ' + lastName + '?',
                    callback_id: ASK_NAME_EVENT,
                    attachment_type: 'default',
                    actions: [
                        {
                            name: 'yes',
                            text: 'Yes',
                            value: 'name_confirm',
                            type: 'button'
                        },
                        {
                            name: 'no',
                            text: 'No',
                            value: 'name_decline',
                            type: 'button',
                            style: 'danger'
                        }
                    ]
                }
            ]
        },[
            {
                pattern: 'name_confirm',
                callback: function(reply, convo) {
                    console.log(reply);
                    convo.say('Cool! Awesome name!!');
                    askEmail(convo);
                    convo.next();
                }
            },
            {
                pattern: 'name_decline',
                callback: function(reply, convo) {
                    convo.say("That's too bad.");
                    convo.next();
                }
            }
        ], {key: 'name'});
    }

    /**
     * Step 3: Validate the users email address
     *
     * @access private
     * @param  object convo the conversation object
     * @return void
     */
    var askEmail = function(convo)
    {
        convo.ask({
            attachments: [
                {
                    title: 'Is ' + email + ' your email address?',
                    callback_id: ASK_EMAIL_EVENT,
                    attachment_type: 'default',
                    actions: [
                        {
                            name: 'yes',
                            text: 'Yes',
                            value: 'email_confirm',
                            type: 'button'
                        },
                        {
                            name: 'no',
                            text: 'No',
                            value: 'email_decline',
                            type: 'button',
                            style: 'danger'
                        }
                    ]
                }
            ]
        },[
            {
                pattern: 'email_confirm',
                callback: function(reply, convo) {
                    finished(convo);
                    convo.next();
                }
            },
            {
                pattern: 'email_decline',
                callback: function(reply, convo) {
                    convo.say("There's no way that isn't your email address. We're done here.");
                    convo.next();
                }
            }
        ], {key: 'email'});
    }

    /**
     * Step 4: Thanky you blurb
     *
     * @access private
     * @param  object convo the conversation object
     * @return void
     */
    var finished = function(convo)
    {
        convo.say('Thanks ' + firstName + "! That's all I needed.");
        convo.say("Lets start invite people to 1:1s!");
        convo.say("We can get a list of people to invite in a channel by saying \"create team #<channel name>\"");
        convo.next();
    }
}

module.exports = OnBoard;
