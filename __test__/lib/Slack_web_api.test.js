let slackWebApi;
let mockRequest;
let mockBot;

beforeEach(() => {

    mockRequest = {
        post: jest.fn()
    };
    jest.mock('request', () => mockRequest);

    mockBot = {
        config: {},
        debug: jest.fn(),
        log: jest.fn(),
        userAgent: jest.fn()
    };

    mockBot.log.error = jest.fn();

    slackWebApi = require('../../lib/Slack_web_api');
});

describe('config', function() {
    test('default api_root', () => {
        const instance = slackWebApi(mockBot, {});
        expect(instance.api_url).toBe('https://slack.com/api/');
    });

    test('setting api_root', () => {
        mockBot.config.api_root = 'http://www.somethingelse.com';
        const instance = slackWebApi(mockBot, {});
        expect(instance.api_url).toBe('http://www.somethingelse.com/api/');
    });
});

