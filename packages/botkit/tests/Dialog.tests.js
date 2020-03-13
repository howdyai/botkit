const assert = require('assert');
const { ActivityTypes } = require('botbuilder');
const { Botkit, BotkitTestClient, BotkitConversation } = require('../');

let bot;

describe('Botkit dialog', function() {
    beforeEach(async () => {
        bot = new Botkit({
            disable_webserver: true,
            disable_console: true
        });
    });

    it('should follow a dialog', async function() {
        const introDialog = new BotkitConversation('introduction', bot);
        introDialog.ask({
            text: 'You can say Ok',
            quick_replies: [{
                title: 'Ok',
                payload: 'Ok'
            }]
        }, [], 'continue');
        introDialog.say('you said {{vars.continue}}');
        introDialog.ask({
            text: 'say repeat'
        }, [{
            pattern: 'repeat',
            handler: async (val, convo, bot, message) => {
                await convo.repeat();
            }
        }, {
            default: true,
            handler: async () => {
                // noop
            }
        }], 'choice');
        introDialog.say('you said {{vars.choice}}');
        bot.addDialog(introDialog);

        // set up a test client
        const client = new BotkitTestClient('test', bot, 'introduction');

        // Get details for the reply
        const quickreply_reply = await client.sendActivity();
        assert(quickreply_reply.text === 'You can say Ok', 'wrong first message');
        assert(quickreply_reply.channelData.quick_replies[0].title === 'Ok', 'wrong quick reply');

        const next_reply = await client.sendActivity('Ok');
        assert(next_reply.text === 'you said Ok', 'wrong reply');

        const reply3 = await client.getNextReply();
        assert(reply3.text === 'say repeat', 'wrong reply 3');

        const reply4 = await client.sendActivity('repeat');
        assert(reply4.text === 'say repeat', 'wrong reply 4');

        const reply5 = await client.sendActivity('repeat');
        assert(reply5.text === 'say repeat', 'wrong reply 5');

        const reply6 = await client.sendActivity('2');
        assert(reply6.text === 'you said 2', 'wrong reply 6');
    });

    it('should work with convo.repeat', async function() {
        const botConvo = new BotkitConversation('testConvo', bot);

        botConvo.ask({
            text: ['what is your name?']
        }, [
            {
                default: true,
                handler: async (answer, convo, bot) => {
                    await bot.say(`hi ${ answer }`);
                }
            }
        ], 'name');

        // botConvo.say('ok');

        botConvo.ask({
            text: ['what is your last name{{vars.count}}']
        }
        , [
            {
                pattern: 'smith',
                handler: async (answer, convo, bot) => {
                    await bot.say('I like the name smith');
                }
            },
            {
                default: true,
                handler: async (answer, convo, bot) => {
                    await bot.say('name not recognized, say another name');

                    let count = convo.vars.count;
                    if (!count) {
                        count = 1;
                    } else {
                        count++;
                    }
                    convo.setVar('count', count)/
                    await convo.repeat();
                }
            }
        ], 'last-name');

        bot.addDialog(botConvo);

        // set up a test client
        const client = new BotkitTestClient('test', bot, 'testConvo');

        // Get details for the reply
        const quickreply_reply = await client.sendActivity();
        assert(quickreply_reply.text === 'what is your name?', 'did not get name prompt');

        const next_reply = await client.sendActivity('chester');
        assert(next_reply.text === 'hi chester', 'did not echo name');

        // const ok = await client.getNextReply();
        // assert(ok.text === 'ok','did not hear ok');

        const reply3 = await client.getNextReply();
        assert(reply3.text === 'what is your last name', 'did not get last name prompt');

        const reply4 = await client.sendActivity('phillips');
        assert(reply4.text === 'name not recognized, say another name', 'did not get invalid error 1');

        const reply5 = await client.getNextReply();
        assert(reply5.text === 'what is your last name1', 'did not get reprompt');

        const reply6 = await client.sendActivity('brown');
        assert(reply6.text === 'name not recognized, say another name', 'did not get invalid error 2');

        const reply8 = await client.getNextReply();
        assert(reply8.text === 'what is your last name2', 'did not get reprompt');

        const reply9 = await client.sendActivity('smith');
        assert(reply9.text === 'I like the name smith', 'did not get final confirm');
    });


    it('should work with convo.repeat in an onchange', async function() {
        const botConvo = new BotkitConversation('testConvo', bot);

        botConvo.ask({
            text: ['what is your name?']
        }, [], 'name');

        botConvo.onChange('name', async(response,convo)=>{ 
            if (response != 'smith') {
                await convo.repeat();
            }
        });

        botConvo.say('done');

        bot.addDialog(botConvo);

        // set up a test client
        const client = new BotkitTestClient('test', bot, 'testConvo');
        let msg = await client.sendActivity('');
        assert(msg.text == 'what is your name?', 'initial prompt wrong');
        msg = await client.sendActivity('phillips');
        assert(msg.text == 'what is your name?', 'reprompt wrong');
        msg = await client.sendActivity('brown');
        assert(msg.text == 'what is your name?', 'reprompt 2 wrong');
        msg = await client.sendActivity('smith');
        assert(msg.text == 'done', 'did not wrap up');

    });

    it('should work with call to addchildDialog', async function() {
        const botConvo = new BotkitConversation('testConvo', bot);
        botConvo.ask('What is your name?', async (response, convo, bot) => {
        }, 'name');
        botConvo.addChildDialog('testConvo2', 'stuff');
        botConvo.say('got it.');
        bot.addDialog(botConvo);

        const botConvo2 = new BotkitConversation('testConvo2', bot);

        botConvo2.ask('What is your favorite color?', async (response, convo, bot) => {
            // noop
        }, 'color');
        botConvo2.say('ok');
        bot.addDialog(botConvo2);

        // set up a test client
        const client = new BotkitTestClient('test', bot, ['testConvo', 'testConvo2']);

        const prompt = await client.sendActivity('..');
        assert(prompt.text === 'What is your name?', 'wrong prompt 1');

        const prompt2 = await client.sendActivity('ben');
        assert(prompt2.text === 'What is your favorite color?', 'wrong prompt 2');

        const reply = await client.sendActivity('black');
        assert(reply.text == 'ok', 'wrong reply');

        const reply2 = await client.getNextReply();
        assert(reply2.text == 'got it.', 'wrong reply 2 in addChildDialog test');
    });

    it('should work with call to addGotoDialog', async function() {
        const botConvo = new BotkitConversation('testConvo', bot);
        botConvo.ask('What is your name?', async (response, convo, bot) => {
        }, 'name');
        botConvo.addGotoDialog('testConvo2');
        botConvo.say('got it.');
        bot.addDialog(botConvo);

        const botConvo2 = new BotkitConversation('testConvo2', bot);
        botConvo2.ask('What is your favorite color?', async (response, convo, bot) => {
            // noop
        }, 'color');
        botConvo2.say('ok');
        bot.addDialog(botConvo2);

        // set up a test client
        const client = new BotkitTestClient('test', bot, ['testConvo', 'testConvo2']);

        const prompt = await client.sendActivity('..');
        assert(prompt.text === 'What is your name?', 'wrong prompt 1');

        const prompt2 = await client.sendActivity('ben');
        assert(prompt2.text === 'What is your favorite color?', 'wrong prompt 2');

        const reply = await client.sendActivity('black');
        assert(reply.text == 'ok', 'wrong reply');

        const reply2 = await client.getNextReply();
        assert(reply2 == null, 'wrong reply 2 in addGotoDialog test');
    });

    it('should work with call to beginDialog in handler', async function() {
        const botConvo = new BotkitConversation('testConvo', bot);
        botConvo.ask('What is your name?', async (response, convo, bot) => {
            await bot.beginDialog('testConvo2');
        }, 'name');
        botConvo.say('got it.');
        bot.addDialog(botConvo);

        const botConvo2 = new BotkitConversation('testConvo2', bot);
        botConvo2.ask('What is your favorite color?', async (response, convo, bot) => {
            // noop
        }, 'color');
        botConvo2.say('ok you said {{vars.color}}');
        bot.addDialog(botConvo2);

        // set up a test client
        const client = new BotkitTestClient('test', bot, ['testConvo', 'testConvo2']);

        const prompt = await client.sendActivity('..');
        assert(prompt.text === 'What is your name?', 'wrong prompt 1');

        const prompt2 = await client.sendActivity('ben');
        assert(prompt2.text === 'What is your favorite color?', 'wrong prompt 2');

        const reply = await client.sendActivity('black');
        assert(reply.text === 'ok you said black', 'wrong reply');

        const reply2 = await client.getNextReply();
        assert(reply2.text === 'got it.', 'wrong reply 2 in beginDialog test');
    });


    it('should navigate threads', async function() {
        // test all the ways threads are triggered
        // convo.gotoThread inside an ask
        // convo.gotoThread inside an onChange
        // addAction
        // message with action field
        // convo.gotoThread inside a beforeThread

        const botConvo = new BotkitConversation('testConvo', bot);
        let beforeThreadFired = false;
        let beforeThread2Fired = false;
        let beforeThread3Fired = false;
        let beforeThread4Fired = false;
        let beforeThread5Fired = false;
        let beforeThread6Fired = false;

        botConvo.say('1');
        botConvo.addAction('thread-2');
        botConvo.addMessage('2', 'thread-2');
        botConvo.addQuestion('what?', async (response, convo, bot) => {
            await convo.gotoThread('thread-3');
        }, 'what', 'thread-2');
        botConvo.addMessage('3', 'thread-3');
        botConvo.addMessage('4', 'thread-4');
        botConvo.addQuestion('what?', [], 'what2', 'thread-4');
        botConvo.onChange('what2', async (response, convo, bot) => {
            await convo.gotoThread('thread-5');
        });
        botConvo.addMessage('5', 'thread-5');
        botConvo.addMessage({ text: 'next', action: 'thread-6' }, 'thread-5');
        botConvo.addMessage('6', 'thread-6');

        botConvo.before('default', async (convo, bot) => {
            beforeThreadFired = true;
        });

        botConvo.before('thread-2', async (convo, bot) => {
            beforeThread2Fired = true;
        });
        botConvo.before('thread-3', async (convo, bot) => {
            beforeThread3Fired = true;
            convo.gotoThread('thread-4');
        });
        botConvo.before('thread-4', async (convo, bot) => {
            beforeThread4Fired = true;
        });
        botConvo.before('thread-5', async (convo, bot) => {
            beforeThread5Fired = true;
        });
        botConvo.before('thread-6', async (convo, bot) => {
            beforeThread6Fired = true;
        });
        bot.addDialog(botConvo);

        // set up a test client
        const client = new BotkitTestClient('test', bot, 'testConvo');

        let prompt = await client.sendActivity('..');
        assert(beforeThreadFired === true, 'beforeThread did not fire');
        assert(prompt.text === '1', 'message 1 wrong');

        prompt = await client.getNextReply();
        assert(prompt.text === '2', 'message 2 wrong');
        assert(beforeThread2Fired === true, 'before2Thread did not fire');

        prompt = await client.getNextReply();
        assert(prompt.text === 'what?', 'message 3 wrong');

        prompt = await client.sendActivity('..');
        assert(prompt.text === '4', 'message 4 wrong');
        assert(beforeThread3Fired === true, 'before3Thread did not fire');
        assert(beforeThread4Fired === true, 'before4Thread did not fire');

        prompt = await client.getNextReply();
        assert(prompt.text === 'what?', 'message 5 wrong');

        prompt = await client.sendActivity('..');
        assert(prompt.text === '5', 'message 6 wrong');
        assert(beforeThread5Fired === true, 'before5Thread did not fire');

        prompt = await client.getNextReply();
        assert(prompt.text === 'next', 'message 7 wrong');
        prompt = await client.getNextReply();
        assert(prompt.text === '6', 'message 8 wrong');
        assert(beforeThread6Fired === true, 'before6Thread did not fire');
    });

    it('should capture values correctly', async function() {
        // capture with a simple ask
        // capture with a child dialog

        let correct = false;

        let correct1 = false;
        let correct2 = false;
        let correct3 = false;
        let correct4 = false;

        const botConvo = new BotkitConversation('testConvo', bot);
        const botConvo2 = new BotkitConversation('testConvo2', bot);

        botConvo.ask('name', [], 'name');
        botConvo.ask('color', [], 'color');
        botConvo2.ask('location', [], 'location');
        botConvo2.ask('preference', [], 'preference');
        botConvo.addChildDialog('testConvo2', 'profile');

        botConvo.onChange('name', async (response) => {
            correct1 = response === 'name';
        });
        botConvo.onChange('color', async (response) => {
            correct2 = response === 'color';
        });
        botConvo2.onChange('location', async (response) => {
            correct3 = response === 'location';
        });
        botConvo2.onChange('preference', async (response) => {
            correct4 = response === 'preference';
        });

        botConvo.after(async (results, bot) => {
            correct = (results.name == 'name' && results.color == 'color' && results.profile.location == 'location' && results.profile.preference == 'preference');
        });

        bot.addDialog(botConvo);
        bot.addDialog(botConvo2);

        // set up a test client
        const client = new BotkitTestClient('test', bot, ['testConvo', 'testConvo2']);

        let msg = await client.sendActivity('..');
        assert(msg.text == 'name', 'first prompt wrong');
        msg = await client.sendActivity('name');
        assert(msg.text == 'color', 'second prompt wrong');
        msg = await client.sendActivity('color');
        assert(msg.text == 'location', 'third prompt wrong');
        msg = await client.sendActivity('location');
        assert(msg.text == 'preference', 'fourth prompt wrong');
        msg = await client.sendActivity('preference');
        assert(correct, 'Value were NOT captured correctly');
        assert(correct1, 'value 1 was correct during onchange');
        assert(correct2, 'value 2 was correct during onchange');
        assert(correct3, 'value 3 was correct during onchange');
        assert(correct4, 'value 4 was correct during onchange');
    });

    it('should handle a series of child dialogs', async function() {

        let correct = false;

        const conversationChildDialogs = new BotkitConversation('child_dialogs', bot);
        const conversationA = new BotkitConversation('A', bot);
        const conversationB = new BotkitConversation('B', bot);
        const conversationC = new BotkitConversation('C', bot);
        const conversationD = new BotkitConversation('D', bot);

        bot.addDialog(conversationChildDialogs);
        bot.addDialog(conversationA);
        bot.addDialog(conversationB);
        bot.addDialog(conversationC);
        bot.addDialog(conversationD);

        conversationChildDialogs.addChildDialog('A');
        conversationChildDialogs.addChildDialog('B');
        conversationChildDialogs.addChildDialog('C');
        conversationChildDialogs.addChildDialog('D');
        conversationChildDialogs.after(async (results) => {
            correct = (results.A.A == 'A') && (results.B.B == 'B') && (results.C.C == 'C') && (results.D.D=='D');
        });

        conversationA.ask({
            text: ['A reply to me']
        }, [
            {
                handler: async (response, convo, bot) => {
                }
            } ], 'A');

        conversationB.ask({
            text: ['B reply to me']
        }, [
            {
                handler: async (response, convo, bot) => {
                }
            } ], 'B');

        conversationC.ask({
            text: ['C reply to me']
        }, [
            {
                handler: async (response, convo, bot) => {
                }
            } ], 'C');

        conversationD.ask({
            text: ['D reply to me']
        }, [
            {
                handler: async (response, convo, bot) => {
                }
            } ], 'D');

        const client = new BotkitTestClient('test', bot, ['child_dialogs', 'A', 'B', 'C', 'D']);
        let reply = await client.sendActivity('..');
        assert(reply.text == 'A reply to me', 'A wrong');
        reply = await client.sendActivity('A');
        assert(reply.text == 'B reply to me', 'B wrong');
        reply = await client.sendActivity('B');
        assert(reply.text == 'C reply to me', 'C wrong');
        reply = await client.sendActivity('C');
        assert(reply.text == 'D reply to me', 'D wrong');
        reply = await client.sendActivity('D');
        assert(reply == null,'not null');
        reply = await client.getNextReply();
        assert(reply == null,'not null');
        assert(correct,'results did not match expected format');
    });

    it('should allow cancel', async function() {

        let after_fired = false;
        const botConvo = new BotkitConversation('testConvo', bot);
        botConvo.say('errr');
        botConvo.say('boo');
        botConvo.ask('huh?', async(response, convo, bot) => {
            await bot.cancelAllDialogs();
        },'wha');
        botConvo.say('foo');
        botConvo.after(async(results, bot) => {
            after_fired = true;
        });
        bot.addDialog(botConvo);

        // set up a test client
        const client = new BotkitTestClient('test', bot, 'testConvo');
        let msg = await client.sendActivity('..');
        assert(msg.text == 'errr','no errr');
        msg = await client.getNextReply();
        assert(msg.text == 'boo','no boo');
        msg = await client.getNextReply();
        assert(msg.text == 'huh?', 'wrong prompt');
        msg = await client.sendActivity('..');
        assert(msg == null,'did not cancel');
        msg = await client.getNextReply();
        assert(msg == null,'did not cancel 2');
        assert(after_fired === false, 'after fired after cancel');

    });


    it('should allow cancel inside child dialog', async function() {

        let after_fired = false;
        let after_fired2 = false;

        const botConvo = new BotkitConversation('testConvo', bot);
        const botConvo2 = new BotkitConversation('testConvo2', bot);
        botConvo.say('hi');
        botConvo.addChildDialog('testConvo2');
        botConvo.say('foo');
        botConvo2.ask('huh?', async(r, convo, bot) => {
            await bot.cancelAllDialogs();
        });
        botConvo2.say('blarg');

        botConvo.after(async(results, bot) => {
            after_fired = true;
        });
        botConvo2.after(async(results, bot) => {
            after_fired2 = true;
        });

        bot.addDialog(botConvo);
        bot.addDialog(botConvo2);

        // set up a test client
        const client = new BotkitTestClient('test', bot, ['testConvo', 'testConvo2']);
        let msg = await client.sendActivity('..');
        assert(msg.text === 'hi', 'wrong msg 1');
        msg = await client.getNextReply();
        assert(msg.text == 'huh?', 'wrong msg 2');
        msg = await client.sendActivity('..');
        assert(msg == null, 'did not cancel');
        assert(after_fired === false,'after dialog fired');
        assert(after_fired2 === false,'after dialog of child fired');

    });

    it('should stop when convo.stop is called', async function() {

        let after_fired = false;
        const botConvo = new BotkitConversation('testConvo', bot);
        botConvo.say('errr');
        botConvo.say('boo');
        botConvo.ask('huh?', async(response, convo, bot) => {
            convo.stop();
        },'wha');
        botConvo.say('foo');
        botConvo.after(async(results, bot) => {
            after_fired = true;
        });
        bot.addDialog(botConvo);

        // set up a test client
        const client = new BotkitTestClient('test', bot, 'testConvo');
        let msg = await client.sendActivity('..');
        assert(msg.text == 'errr','no errr');
        msg = await client.getNextReply();
        assert(msg.text == 'boo','no boo');
        msg = await client.getNextReply();
        assert(msg.text == 'huh?', 'wrong prompt');
        msg = await client.sendActivity('..');
        assert(msg == null,'did not stop');
        msg = await client.getNextReply();
        assert(msg == null,'did not stop 2');
        assert(after_fired === true, 'after fired after stop');

    });

    it('should call handlers for addQuestion and ask with entire message payload', async () => {
        const conversation = new BotkitConversation('nameConvo', bot);

        let correct1 = false;
        let correct2 = false;
        let correct3 = false;
        let correct4 = false;
        let correct5 = false;

        conversation.ask(
            'First name?',
            async (response, convo, bot, message) => {
                correct1 = message.type === ActivityTypes.Message && message.text === 'Tony' && response === message.text;
                convo.gotoThread('last_name');
            },
            'firstName'
        );
        conversation.addQuestion(
            'Last name?',
            async (response, convo, bot, message) => {
                correct2 = message.type === ActivityTypes.Message && message.text === 'Stark' && response === message.text;
                convo.gotoThread('address');
            },
            'lastName',
            'last_name'
        );

        conversation.addQuestion(
            'Address?',
            async (response, convo, bot, message) => {
                correct3 = message.type === ActivityTypes.Message &&
                    message.text === '10880 Malibu Point, 90265, Malibu, California' &&
                    response === message.text;
                convo.gotoThread('color');
            },
            'address',
            'address'
        );
        conversation.addQuestion(
            'Favourite Color?',
            [
                {
                    default: true,
                    handler: async (response, convo, bot, message) => {
                        correct4 = message.type === ActivityTypes.Message && response === message.text;
                        await convo.repeat();
                    }
                },
                {
                    pattern: 'Red',
                    handler: async (response, convo, bot, message) => {
                        correct5 = message.type === ActivityTypes.Message &&
                            message.text === 'Red' && response === message.text;
                        await convo.stop();
                    }
                }
            ],
            'color',
            'color'
        );

        bot.addDialog(conversation);

        // set up a test client
        const client = new BotkitTestClient('test', bot, ['nameConvo']);

        let msg = await client.sendActivity('..');
        assert(msg.text === 'First name?', 'first prompt wrong');

        msg = await client.sendActivity('Tony');
        assert(msg.text === 'Last name?', 'second prompt wrong');

        msg = await client.sendActivity('Stark');
        assert(msg.text === 'Address?', 'third prompt wrong');

        msg = await client.sendActivity('10880 Malibu Point, 90265, Malibu, California');
        assert(msg.text === 'Favourite Color?', 'fourth prompt wrong');

        msg = await client.sendActivity('Black');
        assert(msg.text === 'Favourite Color?', 'repeat prompt wrong');

        msg = await client.sendActivity('Red');

        assert(correct1, 'message text not correct for prompt1');
        assert(correct2, 'message text not correct for prompt2');
        assert(correct3, 'message text not correct for prompt3');
        assert(correct4, 'message text not correct for prompt4');
        assert(correct5, 'message text not correct for prompt5');
    });

    afterEach(async () => {
        await bot.shutdown();
    });
});