'use strict';

let botkit;

jest.mock('../../lib/CoreBot', () => 'corebot');
jest.mock('../../lib/SlackBot', () => 'slackbot');
jest.mock('../../lib/Facebook', () => 'facebook');
jest.mock('../../lib/TwilioIPMBot', () => 'twilioipm');
jest.mock('../../lib/TwilioSMSBot', () => 'twiliosms');
jest.mock('../../lib/BotFramework', () => 'botframework');
jest.mock('../../lib/WebexBot', () => 'webex');
jest.mock('../../lib/ConsoleBot', () => 'console');
jest.mock('../../lib/Web', () => 'anywhere');
jest.mock('../../lib/Teams', () => 'teams');
jest.mock('../../lib/GoogleHangoutsBot', () => 'googlehangoutsbot');

beforeEach(() => {
    jest.clearAllMocks();
    botkit = require('../../lib/Botkit');
});

test('exports bot interfaces', () => {
    expect(botkit.core).toBe('corebot');
    expect(botkit.slackbot).toBe('slackbot');
    expect(botkit.facebookbot).toBe('facebook');
    expect(botkit.twilioipmbot).toBe('twilioipm');
    expect(botkit.twiliosmsbot).toBe('twiliosms');
    expect(botkit.botframeworkbot).toBe('botframework');
    expect(botkit.webexbot).toBe('webex');
    expect(botkit.teamsbot).toBe('teams');
    expect(botkit.consolebot).toBe('console');
    expect(botkit.anywhere).toBe('anywhere');
    expect(botkit.googlehangoutsbot).toBe('googlehangoutsbot');

});

