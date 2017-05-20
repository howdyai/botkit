let slackWebApi;
let mockRequest;
let mockResponse;
let responseError;
let mockBot;
mockRequest = {
    post: jest.fn()
};

jest.mock('request', () => mockRequest);


beforeEach(() => {
    jest.clearAllMocks();

    responseError = null;

    mockResponse = {
        statusCode: 200,
        body: '{}'
    }

    mockBot = {
        config: {},
        debug: jest.fn(),
        log: jest.fn(),
        userAgent: jest.fn()
    };

    mockBot.log.error = jest.fn();

    mockRequest.post.mockImplementation((params, cb) => {
        cb(null, mockResponse, mockResponse.body);
    });

    slackWebApi = require('../../lib/Slack_web_api');
});

describe('config', () => {
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

describe('callApi', () => {
    let instance;

    test('uses data.token by default and post', () => {
        const data = {
            token: 'abc123'
        };
        const cb = jest.fn();

        instance = slackWebApi(mockBot, {});
        instance.callAPI('some.method', data, cb);

        expect(mockRequest.post.mock.calls.length).toBe(1);
        const firstArg = mockRequest.post.mock.calls[0][0];
        expect(firstArg.form.token).toBe('abc123');
    });

    test('uses config.token if data.token is missing', () => {
        const data = {};
        const cb = jest.fn();

        instance = slackWebApi(mockBot, { token: 'abc123' });
        instance.callAPI('some.method', data, cb);

        expect(mockRequest.post.mock.calls.length).toBe(1);
        const firstArg = mockRequest.post.mock.calls[0][0];
        expect(firstArg.form.token).toBe('abc123');
    });
});

describe('callApiWithoutToken', () => {
    let instance;

    test('uses data values by default', () => {
        const data = {
            client_id: 'id',
            client_secret: 'secret',
            redirect_uri: 'redirectUri'
        };
        const cb = jest.fn();

        instance = slackWebApi(mockBot, {});
        instance.callAPIWithoutToken('some.method', data, cb);

        expect(mockRequest.post.mock.calls.length).toBe(1);
        const firstArg = mockRequest.post.mock.calls[0][0];
        expect(firstArg.form.client_id).toBe('id');
        expect(firstArg.form.client_secret).toBe('secret');
        expect(firstArg.form.redirect_uri).toBe('redirectUri');
    });

    test('uses config values if not set in data', () => {
        const config = {
            clientId: 'id',
            clientSecret: 'secret',
            redirectUri: 'redirectUri'
        };
        const cb = jest.fn();

        // this seems to be an API inconsistency:
        // callAPIWithoutToken uses bot.config, but callAPI uses that passed config
        mockBot.config = config;

        instance = slackWebApi(mockBot, {});
        instance.callAPIWithoutToken('some.method', {}, cb);

        expect(mockRequest.post.mock.calls.length).toBe(1);
        const firstArg = mockRequest.post.mock.calls[0][0];
        expect(firstArg.form.client_id).toBe('id');
        expect(firstArg.form.client_secret).toBe('secret');
        expect(firstArg.form.redirect_uri).toBe('redirectUri');

    });
});

describe('postForm', () => {

    test('handles success', () => {

    });

    test('handles multipart data', () => {

    });

    test('handles request lib error', () => {

    });

    test('handles non 200 response code', () => {

    });

    test('handles error parsing body', () => {

    });

    test('handles ok.false response', () => {

    });
});


describe('api methods', () => {
    let instance;

    beforeEach(() => {
        instance = slackWebApi(mockBot, {});
    });

    test('spot check api methods ', () => {
        // testing for all methods seems wasteful, but let's confirm the methods got built correctly and test the following scenarios

        // two levels
        expect(instance.auth).toBeDefined();
        expect(instance.auth.test).toBeDefined();

        // three levels
        expect(instance.users).toBeDefined();
        expect(instance.users.profile).toBeDefined();
        expect(instance.users.profile.get).toBeDefined();
    });

    describe('special cases', () => {

        beforeEach(() => {

        });

        test('chat.postMessage ', () => {

        });

        test('chat.update ', () => {

        });

        test('files.upload ', () => {

        });
    });
});
