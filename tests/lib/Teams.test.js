'use strict';
let teamsBot;
let teamsApi;
let config = {
    clientId: 'client',
    clientSecret: 'secret',
    debug: false
};

describe('authentication', () => {
    beforeEach(() => {
        jest.doMock('../../lib/TeamsAPI', () => {
            return jest.fn((configuration) => {
                return {
                    getToken: jest.fn((cb) => {
                        configuration.token =  'token';
                        configuration.token_expires_in = '3600';
                        cb(null);
                    })
                };
            });
        });

        jest.useFakeTimers();
        teamsApi = require('../../lib/TeamsAPI');
    });

    afterEach(() => {
        jest.resetModules();
        jest.clearAllTimers();
    });

    test('get token', () => {
        let bot = require('../../lib/Teams')(config);
        expect(bot.api.getToken).toHaveBeenCalledTimes(1);
    });

    test('refresh token before expiry', () => {
        let bot = require('../../lib/Teams')(config);
        expect(bot.api.getToken).toHaveBeenCalledTimes(1);
        jest.runOnlyPendingTimers();
        expect(bot.api.getToken).toHaveBeenCalledTimes(2);
    });

    test('token valid for 20 mins should refresh after 10 mins', () => {
        teamsApi.mockImplementation(jest.fn((configuration) => {
            return {
                getToken: jest.fn((cb) => {
                    configuration.token =  'token';
                    configuration.token_expires_in = '1200';
                    cb(null);
                })
            };
        }));
        let bot = require('../../lib/Teams')(config);
        expect(bot.config.token_expires_in).toBe('1200');
        expect(bot.api.getToken).toHaveBeenCalledTimes(1);
        jest.runTimersToTime(1000 * 60 * 9);
        expect(bot.api.getToken).toHaveBeenCalledTimes(1);
        jest.runTimersToTime(1000 * 60 * 1.1);
        expect(bot.api.getToken).toHaveBeenCalledTimes(2);
    });
});
