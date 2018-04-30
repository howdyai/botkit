'use strict';

const util = require('util');
const EventEmitter = require('events').EventEmitter;

let mockWs;
function mockWebSocket(url) {
    this.url = url;
    this.close = function() { };
    this.ping = function() { };
    mockWs = this;
}
util.inherits(mockWebSocket, EventEmitter);

jest.mock('ws', () => mockWebSocket);

let mockResponse;
let mockRequest = {
    post: jest.fn().mockImplementation((params, cb) => {
        cb(null, mockResponse, mockResponse.body);
    })
};
jest.mock('request', () => mockRequest);

// these need to be required after mocks are set up
const CoreBot = require('../../lib/CoreBot');
const Slackbot_worker = require('../../lib/Slackbot_worker');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('startRTM', () => {
    it('connects to rtm url and calls callback function', () => {
        const botkit = CoreBot({});
        const bot = Slackbot_worker(botkit, {});

        mockResponse = {
            statusCode: 200,
            body: JSON.stringify({
                ok: true,
                url: 'http://mockurl',
                self: {
                    name: 'botkit'
                }
            })
        };

        const cb = jest.fn();
        bot.startRTM(cb);
        mockWs.emit('open');
        expect(mockRequest.post).toHaveBeenCalledTimes(1);
        expect(mockWs.url).toBe('http://mockurl');
        expect(cb).toHaveBeenCalledTimes(1);

        bot.closeRTM();

        const errorArg = cb.mock.calls[0][0];
        expect(errorArg).toBeNull();
    });
    it('handles Slack API rtm.connect errors', () => {
        const botkit = CoreBot({});
        const bot = Slackbot_worker(botkit, {});

        mockResponse = {
            statusCode: 200,
            body: JSON.stringify({
                ok: false,
                error: 'test_error'
            })
        };

        const cb = jest.fn();
        bot.startRTM(cb);
        expect(mockRequest.post).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledTimes(1);
        bot.closeRTM();

        const errorArg = cb.mock.calls[0][0];
        expect(errorArg).toBe('test_error');
    });
    it('handles websocket connection errors', () => {
        const botkit = CoreBot({});
        const bot = Slackbot_worker(botkit, {});

        mockResponse = {
            statusCode: 200,
            body: JSON.stringify({
                ok: true,
                url: 'http://mockurl',
                self: {
                    name: 'botkit'
                }
            })
        };

        const cb = jest.fn();
        bot.startRTM(cb);
        mockWs.emit('error', 'test websocket error');
        expect(mockRequest.post).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledTimes(1);

        bot.closeRTM();

        const errorArg = cb.mock.calls[0][0];
        expect(errorArg).toBe('test websocket error');
    });
});
