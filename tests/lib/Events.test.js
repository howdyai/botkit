const botkit = require('../../lib/Botkit');


test('events passed into .on should trim whitespace', () => {

    const controller = botkit.core({});
    controller.on('hello, test,toot ', function() {});

    expect(controller.events.hello).toBeDefined();
    expect(controller.events.test).toBeDefined();
    expect(controller.events.toot).toBeDefined();

});
