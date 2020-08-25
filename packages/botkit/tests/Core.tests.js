const assert = require('assert');
const { Botkit, TeamsBotWorker } = require('../');
const { TwilioAdapter, TwilioBotWorker } = require('../../botbuilder-adapter-twilio-sms');

describe('Botkit', function() {
    it('should create a Botkit controller', function() {
        assert((new Botkit({ disable_console: true, disable_webserver: true }) instanceof Botkit), 'Botkit is wrong type');
    });
    it ('should spawn appropriate bot worker with a single adapter', async function() {
        const controller = new Botkit({
            disable_webserver: true,
            adapter: new TwilioAdapter({enable_incomplete: true}),
        });
        
        const bot = await controller.spawn({});
        assert((bot instanceof TwilioBotWorker), 'Bot worker is wrong type');


    });
    it ('should spawn appropriate bot worker with a multiple adapter', async function() {

        const controller = new Botkit({
            disable_webserver: true,
        });

        const anotherAdapter = new TwilioAdapter({enable_incomplete: true});
        
        const bot = await controller.spawn({});
        assert((bot instanceof TeamsBotWorker), 'Default Bot worker is wrong type');

        const tbot = await controller.spawn({}, anotherAdapter);
        assert((tbot instanceof TwilioBotWorker), 'Secondary Bot worker is wrong type');

    });

});
