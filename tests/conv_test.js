var should = require('should');
var Botkit = require('../');

var controller = Botkit.testbot({});

var bot = controller.spawn({});

//shortcuts
var userSay = controller.userSay.bind(controller);
var botAnswer = controller.botAnswer.bind(controller);

//Load the bot logic
require('../facebook_bot_controler')(controller, bot);

describe('Test Conversation', function () {
  it('should answer Hello', function () {
    userSay('hi');
    botAnswer().text.should.equal('Hello.');
  });
});
