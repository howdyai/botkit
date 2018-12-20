'use strict';

let botkit = require('../lib/CoreBot');

jest.mock('../lib/CoreBot', () => 'corebot');
jest.mock('../lib/SlackBot', () => 'slackbot');
jest.mock('../lib/Facebook', () => 'facebook');
jest.mock('../lib/TwilioIPMBot', () => 'twilioipm');
jest.mock('../lib/TwilioSMSBot', () => 'twiliosms');
jest.mock('../lib/BotFramework', () => 'botframework');
jest.mock('../lib/WebexBot', () => 'webex');
jest.mock('../lib/ConsoleBot', () => 'console');
jest.mock('../lib/Web', () => 'anywhere');
jest.mock('../lib/Teams', () => 'teams');
jest.mock('../lib/GoogleHangoutsBot', () => 'googlehangoutsbot');

describe('CoreBot', () => {

    test('events passed into .on should trim whitespace', () => {

        const controller = botkit.core({});
        controller.on('hello, test,toot ', function () {
        });

        expect(controller.events.hello).toBeDefined();
        expect(controller.events.test).toBeDefined();
        expect(controller.events.toot).toBeDefined();

    });


    test('events to accumulate appropriately', () => {

        const controller = botkit.core({});
        controller.on('hello, test,toot ', function () {
        });
        controller.on('hello  ', function () {
        });
        controller.on('test  ', function () {
        });

        expect(controller.events.hello.length).toBe(2);
        expect(controller.events.test.length).toBe(2);
        expect(controller.events.toot.length).toBe(1);

    });


    test('all handlers bound to an event fire', (done) => {

        const controller = botkit.core({});
        controller.on('hello', function (data) {
            expect(data).toEqual({foo: 'var'});
        });

        controller.on('hello', function (data) {
            expect(data).toEqual({foo: 'var'});
        });

        controller.on('hello', function (data) {
            expect(data).toEqual({foo: 'var'});
            done();
        });
        controller.trigger('hello', [{foo: 'var'}]);

    });

});
