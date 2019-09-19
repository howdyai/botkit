const assert = require('assert');
const { Botkit, BotkitTestClient, BotkitConversation } = require('../');

let bot;

describe('Botkit dialog', function() {
    beforeEach(async () => {
        bot = new Botkit();
    });

    it('should follow a dialog', async function () {
        const introDialog = new BotkitConversation('introduction', bot);
        introDialog.ask({
            text: 'You can say Ok',
            quick_replies: [{
                title: 'Ok',
                payload: 'Ok'
            }],
        }, [], 'continue');
        bot.addDialog(introDialog);

        // set up a test client
        const client = new BotkitTestClient('test', bot, 'introduction');

        // Get details for the reply
        const quickreply_reply = await client.sendActivity();
        assert(quickreply_reply.text === 'You can say Ok');
        assert(quickreply_reply.channelData.quick_replies[0].title === 'Ok');
    });

    afterEach(async () => {
        await bot.shutdown();
    });
});
