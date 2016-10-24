function OnBoard(soapbox)
{
    var soapbox = soapbox;

    var usename, firstName, lastName, email;

    var CONVO_COMPLETED = 'completed';
    var CONVO_STOPPED = 'stopped';
    var CONVO_TIMEOUT = 'timeout';
    var CONVO_TIMEOUT_TIME = 10000;

    this.initOnboard = function(bot, message)
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

                hello(bot, message, convo);
            });
        });
    }

    var hello = function(bot, message, convo)
    {
        convo.say('Hello @' + username + '! Thanks for installing Vee5ive.');
        convo.say('First, let me confim a few things to make sure I have your information.');

        askName(bot, message, convo);
        convo.next();
    }

    var askName = function(bot, message, convo)
    {
        convo.ask({
            attachments: [
                {
                    title: 'Is your full name ' + firstName + ' ' + lastName + '?',
                    callback_id: 'ask_email',
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
                    askEmail(bot, message, convo);
                    convo.next();
                }
            },
            {
                pattern: 'name_decline',
                callback: function(reply, convo) {
                    convo.say("That's too bad.");
                    convo.next();
                }
            },
            {
                pattern: 'stop',
                callback: function(reply, convo) {
                    convo.stop();
                }
            }
        ], {key: 'name'});
    }

    var askEmail = function(bot, message, convo)
    {
        convo.ask({
            attachments: [
                {
                    title: 'Is ' + email + ' your email address?',
                    callback_id: 'ask_name',
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
                    finished(bot, message, convo);
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

    var finished = function(bot, message, convo)
    {
        convo.say('Thanks ' + firstName + "! That's all I needed.");
        convo.say("/invite me to a channel then we can set up a team!");
        convo.say("Let me know you want to create a team with \"@simone create team\" and we can get started setting up 1:1s");
        convo.next();
    }
}

module.exports = OnBoard;
