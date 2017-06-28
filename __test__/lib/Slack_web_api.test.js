'use strict';

let slackWebApi;
let mockRequest;
let mockResponse;
let mockBot;

mockRequest = {};

jest.mock('request', () => mockRequest);

beforeEach(() => {
    mockResponse = {
        statusCode: 200,
        body: '{"ok": true}'
    };

    mockBot = {
        config: {},
        debug: jest.fn(),
        log: jest.fn(),
        userAgent: jest.fn().mockReturnValue('jesting')
    };

    mockBot.log.error = jest.fn();

    mockRequest.post = jest.fn().mockImplementation((params, cb) => {
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

        expect(mockRequest.post).toHaveBeenCalledTimes(1);
        const firstArg = mockRequest.post.mock.calls[0][0];
        expect(firstArg.form.token).toBe('abc123');
    });

    test('uses config.token if data.token is missing', () => {
        const data = {};
        const cb = jest.fn();

        instance = slackWebApi(mockBot, { token: 'abc123' });
        instance.callAPI('some.method', data, cb);

        expect(mockRequest.post).toHaveBeenCalledTimes(1);
        const firstArg = mockRequest.post.mock.calls[0][0];
        expect(firstArg.form.token).toBe('abc123');
    });

    // this case is specific to callAPI, shared cases will be tested below
    test(`handles multipart data`, () => {
        const cb = jest.fn();
        instance = slackWebApi(mockBot, {});
        instance.callAPI('some.method', 'data', cb, true);

        expect(mockRequest.post).toHaveBeenCalledTimes(1);
        const firstArg = mockRequest.post.mock.calls[0][0];

        expect(firstArg.formData).toBe('data');
        expect(firstArg.form).toBeUndefined();
        expect(cb).toHaveBeenCalledWith(null, { ok: true });
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

    ['callAPI', 'callAPIWithoutToken'].forEach((methodName) => {
        let method;
        let cb;

        beforeEach(() => {
            const instance = slackWebApi(mockBot, {});
            method = instance[methodName];
            cb = jest.fn();
        });

        test(`${methodName}: handles success`, () => {
            method('some.action', 'data', cb);
            expect(mockRequest.post).toHaveBeenCalledTimes(1);
            const firstArg = mockRequest.post.mock.calls[0][0];

            // do some thorough assertions here for a baseline
            expect(firstArg.url).toMatch(/some.action$/);
            expect(firstArg.form).toBe('data');
            expect(firstArg.formData).toBeUndefined();
            expect(firstArg.headers).toEqual({ 'User-Agent': 'jesting' });
            expect(cb).toHaveBeenCalledWith(null, { ok: true });
        });

        test(`${methodName}: defaults callback`, () => {
            method('some.action', 'data');
            expect(mockRequest.post).toHaveBeenCalledTimes(1);
        });

        test(`${methodName}: handles request lib error`, () => {
            const error = new Error('WHOOPS!');
            mockRequest.post.mockImplementation((params, callback) => {
                callback(error, null, null);
            });

            method('some.action', 'data', cb);

            expect(mockRequest.post).toHaveBeenCalledTimes(1);
            expect(cb).toHaveBeenCalledWith(error);
        });

        test(`${methodName}: handles 429 response code`, () => {
            mockRequest.post.mockImplementation((params, callback) => {
                callback(null, { statusCode: 429 }, null);
            });

            method('some.action', 'data', cb);

            expect(mockRequest.post).toHaveBeenCalledTimes(1);
            expect(cb).toHaveBeenCalledTimes(1);
            const firstArg = cb.mock.calls[0][0];
            expect(firstArg.message).toBe('Rate limit exceeded');
        });

        test(`${methodName}: handles other response codes`, () => {
            mockRequest.post.mockImplementation((params, callback) => {
                callback(null, { statusCode: 400 }, null);
            });

            method('some.action', 'data', cb);

            expect(mockRequest.post).toHaveBeenCalledTimes(1);
            expect(cb).toHaveBeenCalledTimes(1);
            const firstArg = cb.mock.calls[0][0];
            expect(firstArg.message).toBe('Invalid response');
        });

        test(`${methodName}: handles error parsing body`, () => {
            mockRequest.post.mockImplementation((params, callback) => {
                callback(null, { statusCode: 200 }, '{');
            });

            method('some.action', 'data', cb);

            expect(mockRequest.post).toHaveBeenCalledTimes(1);
            expect(cb).toHaveBeenCalledTimes(1);
            const firstArg = cb.mock.calls[0][0];
            expect(firstArg).toBeInstanceOf(Error);
        });

        test(`${methodName}: handles ok.false response`, () => {
            mockRequest.post.mockImplementation((params, callback) => {
                callback(null, { statusCode: 200 }, '{ "ok": false, "error": "not ok"}');
            });

            method('some.action', 'data', cb);

            expect(mockRequest.post).toHaveBeenCalledTimes(1);
            expect(cb).toHaveBeenCalledWith('not ok', { ok: false, error: 'not ok' });
        });
    });
});

describe('api methods', () => {
    let instance;
    let cb;

    beforeEach(() => {
        instance = slackWebApi(mockBot, {});
        cb = jest.fn();
        jest.spyOn(instance, 'callAPI');
        instance.callAPI.mockImplementation(() => { });
    });

    afterEach(() => {
        if (jest.isMockFunction(JSON.stringify)) {
            JSON.stringify.mockRestore();
        }
        instance.callAPI.mockRestore();
    });

    test('spot check api methods ', () => {
        // testing for all methods seems wasteful, but let's confirm the methods got built correctly and test the following scenarios

        // two levels
        expect(instance.auth).toBeDefined();
        expect(instance.auth.test).toBeDefined();

        instance.auth.test('options', 'cb');
        const firstCallArgs = instance.callAPI.mock.calls[0];
        expect(firstCallArgs).toEqual(['auth.test', 'options', 'cb']);

        // three levels
        expect(instance.users).toBeDefined();
        expect(instance.users.profile).toBeDefined();
        expect(instance.users.profile.get).toBeDefined();

        instance.users.profile.get('options', 'cb');
        const secondCallArgs = instance.callAPI.mock.calls[1];
        expect(secondCallArgs).toEqual(['users.profile.get', 'options', 'cb']);
    });

    describe('special cases', () => {

        test('chat.postMessage stringifies attachments', () => {
            instance.chat.postMessage({ attachments: [] }, cb);
            expect(instance.callAPI).toHaveBeenCalledWith('chat.postMessage', { attachments: '[]' }, cb);
        });

        test('chat.postMessage handles attachments as Strings', () => {
            jest.spyOn(JSON, 'stringify');
            instance.chat.postMessage({ attachments: 'string' }, cb);
            expect(instance.callAPI).toHaveBeenCalledWith('chat.postMessage', { attachments: 'string' }, cb);
            expect(JSON.stringify).not.toHaveBeenCalled();
        });

        test('chat.postMessage handles attachments stringification errors', () => {
            const error = new Error('WHOOPSIE');
            jest.spyOn(JSON, 'stringify').mockImplementation(() => { throw error; });
            instance.chat.postMessage({ attachments: [] }, cb);
            expect(instance.callAPI).toHaveBeenCalledWith('chat.postMessage', {}, cb);
            expect(JSON.stringify).toHaveBeenCalled();
        });

        test('chat.update stringifies attachments', () => {
            instance.chat.update({ attachments: [] }, cb);
            expect(instance.callAPI).toHaveBeenCalledWith('chat.update', { attachments: '[]' }, cb);
        });

        test('chat.update handles attachments as Strings', () => {
            jest.spyOn(JSON, 'stringify');
            instance.chat.update({ attachments: 'string' }, cb);
            expect(instance.callAPI).toHaveBeenCalledWith('chat.update', { attachments: 'string' }, cb);
            expect(JSON.stringify).not.toHaveBeenCalled();
        });

        test('chat.postMessage handles attachments stringification errors', () => {
            const error = new Error('WHOOPSIE');
            jest.spyOn(JSON, 'stringify').mockImplementation(() => { throw error; });
            instance.chat.update({ attachments: [] }, cb);
            expect(instance.callAPI).toHaveBeenCalledWith('chat.update', {}, cb);
            expect(JSON.stringify).toHaveBeenCalled();
        });

        test('files.upload should not use multipart if file is false', () => {
            const options = { file: false, token: 'abc123' };
            instance.files.upload(options, cb);
            expect(instance.callAPI).toHaveBeenCalledWith('files.upload', options, cb, false);
        });

        test('files.upload should use multipart if file is true', () => {
            const options = { file: true, token: 'abc123' };
            instance.files.upload(options, cb);
            expect(instance.callAPI).toHaveBeenCalledWith('files.upload', options, cb, true);
        });
    });
});
