const assert = require('assert');
const { FacebookAdapter } = require('../');
const { FakeAPI, Res, Req, fakeVerifySignature } = require('./shared');

describe('FacebookAdapter', function() {

    let adapter;

    beforeEach(function () {
        adapter = new FacebookAdapter({
            getAccessTokenForPage: async (page) => {
                if (page === 2) { return 'xyz'; } else throw new Error('no token for ' + page);
            },
            app_secret: '123',
            verify_token: '123',
        });
    })

    it('should not construct without required parameters', function () {
        assert.throws(function () { let adapter = new FacebookAdapter({}) }, 'Foo');
    });

    it('should create a FacebookAdapter object', function () {
        assert((adapter instanceof FacebookAdapter), 'Adapter is wrong type');
    });

    it('should process an incoming request into an activity...', function (done) {
        adapter.verifySignature = fakeVerifySignature;
        let res = new Res();
        adapter.processActivity(new Req({
            entry: [
                {
                    messaging: [
                        {
                            sender: { id: 1 },
                            recipient: { id: 2 },
                            message: {
                                text: 'Hello!',
                                sticker_id: 1,
                            }
                        }
                    ]
                }
            ]
        }), res, async (context) => {
            assert(context.activity.type === 'message', 'activity is not a message');
            assert(context.activity.text === 'Hello!', 'activity is missing text');
            assert(context.activity.from.id === 1,'from id is wrong');
            assert(context.activity.recipient.id === 2,'from id is wrong');
            assert(context.activity.channelData.sticker_id === 1, 'platform field is not in channelData');
            done();
        });
    });



    it ('should process an postback incoming request into an activity...', function(done) {
        adapter.verifySignature = fakeVerifySignature;
        let res = new Res();
        adapter.processActivity(new Req({
            entry: [
                {
                    messaging: [
                        {
                            sender: { id: 1 },
                            recipient: { id: 2 },
                            postback: {
                                payload: 'Hello!'
                            }
                        }
                    ]
                }
            ]
        }), res, async(context) => {
            assert(context.activity.type === 'message', 'activity is not a message');
            assert(context.activity.text === 'Hello!', 'activity is missing text');
            done();
        });
    });

    it ('should process a message echo incoming request into an event...', function(done) {
        adapter.verifySignature = fakeVerifySignature;
        let res = new Res();
        adapter.processActivity(new Req({
            entry: [
                {
                    messaging: [
                        {
                            sender: { id: 1 },
                            recipient: { id: 2 },
                            message: {
                                is_echo: true,
                                text: 'Hello!'
                            }
                        }
                    ]
                }
            ]
        }), res, async(context) => {
            assert(context.activity.type === 'event', 'activity is not a event');
            done();
        });
    });


    it ('should process a non-message incoming request into an event...', function(done) {
        adapter.verifySignature = fakeVerifySignature;
        let res = new Res();
        adapter.processActivity(new Req({
            entry: [
                {
                    messaging: [
                        {
                            sender: { id: 1 },
                            recipient: { id: 2 },
                            read: {
                                mid: 1,
                            }
                        }
                    ]
                }
            ]
        }), res, async(context) => {
            assert(context.activity.type === 'event', 'activity is not a event');
            done();
        });
    });

    it ('should process spawn using the right token.', function(done) {
        adapter.verifySignature = fakeVerifySignature;
        let res = new Res();
        adapter.processActivity(new Req({
            entry: [
                {
                    messaging: [
                        {
                            sender: { id: 1 },
                            recipient: { id: 2 },
                            message: {
                                text: 'hi',
                            }
                        }
                    ]
                }
            ]
        }), res, async(context) => {
            let api = await adapter.getAPI(context.activity);
            assert(api, 'api was returned based on activity');
            done();
        });
    });

    it ('outbound message to facebook is properly formed.', function(done) {
        adapter.verifySignature = fakeVerifySignature;
        adapter.getAPI = async (token) => {
            return new FakeAPI(function(endpoint, method, params) {
                assert(params.recipient.id === 1,'outbound message has wrong recipient');
                assert(params.message.text === 'hello','outbound message has wrong text');
                assert(params.message.sticker_id,'sticker id is missing');
                assert(params.message.quick_replies.length === 3,'quick replies are missing');
                done();
            });
        };
        let res = new Res();
        adapter.processActivity(new Req({
            entry: [
                {
                    messaging: [
                        {
                            sender: { id: 1 },
                            recipient: { id: 2 },
                            message: {
                                text: 'hi',
                            }
                        }
                    ]
                }
            ]
        }), res, async(context) => {
            let reply = await context.sendActivity({
                text: 'hello',
                channelData: {
                    sticker_id: 5,
                    quick_replies: [
                        {
                            title: 'foo',
                            payload: 'foo',
                        },
                        {
                            title: 'bar',
                            payload: 'bar',
                        },
                        {
                            title: 'baz',
                            payload: 'baz',
                        },
                    ]
                }
            });
        });
    });
      
    // TODO: test continueConversation resulting in properly formatted messages

});
