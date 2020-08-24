const { Botkit, BotkitConversation, BotkitTestClient, BotWorker } = require('..');
const { TestAdapter, AutoSaveStateMiddleware } = require('botbuilder');
const assert = require('assert');

class FakeBotWorker extends BotWorker {
    constructor(controller, config) {
        super(controller, config);
    }

    getUser() {
        return {
            id: 123,
            name: 'Roger'
        };
    };
}

class FakeAdapter extends TestAdapter {
  // Enables overriding the type of the BotWorker
  // (this uses a Botkit features that allows setting a worker type)
  botkit_worker = FakeBotWorker;
}

class CustomTestClient extends BotkitTestClient {
  constructor(channelId, bot, dialogToTest) {
    super(channelId, bot, dialogToTest);
    this._testAdapter = new FakeAdapter(this._callback, { channelId: channelId }).use(new AutoSaveStateMiddleware(this.conversationState));
  }
}

function createDialog(controller) {
    const dialog = new BotkitConversation('try_custom_worker', controller);

    dialog.ask('How you like me now?', async (response, convo, bot) => {
        const botUser = bot.getUser();
        return bot.say(`You are: ${ botUser.name }`);
    }, 'question');

    return dialog;
}

describe('Test something with custom worker', () => {
    let botkit;
    let client;
    let testAdapter;

    it('bot can access user identity through custom bot worker', async () => {
        testAdapter = new FakeAdapter({});
        botkit = new Botkit({
            disable_webserver: true,
            disable_console: true,
            adapter: testAdapter
        });
        botkit.addDialog(createDialog(botkit));
        client = new CustomTestClient('test', botkit, ['try_custom_worker']);

        // Test the dialog through the client
        let message = await client.sendActivity('');
        assert(message.text === 'How you like me now?');
        message = await client.sendActivity('nice!');
        assert(message.text === 'You are: Roger','Custom adapter spawning invalid bot');
    });

    afterEach(async () => {
        await botkit.shutdown();
    });
});
