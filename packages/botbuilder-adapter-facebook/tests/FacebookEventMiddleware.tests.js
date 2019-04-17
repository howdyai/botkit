const assert = require('assert');
const { FacebookAdapter, FacebookEventTypeMiddleware } = require('../');
const { Res, Req, fakeVerifySignature } = require('./shared');

describe('FacebookEventTypeMiddleware', function() {

    it ('should process a non-message incoming request into an event...', function(done) {

        const adapter = new FacebookAdapter({
            access_token: '123',
            app_secret: '123',
            verify_token: '123',
        });

        adapter.use(new FacebookEventTypeMiddleware());

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
            assert(context.activity.channelData.botkitEventType === 'message_read', 'botkitEventType not set properly');

            done();
        });
    });
});
