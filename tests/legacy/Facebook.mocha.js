var should = require('should');
var sinon = require('sinon');
var nock = require('nock');
require('should-sinon');
var winston = require('winston');
var Botkit = require('../../lib/Botkit.js');

var configuration = {
    api_host: 'testurl.com',
    access_token: '1234',
    verify_token: '5678',
    app_secret: 'X'
};
var badConfiguration = {
    api_host: 'testurl.com',
    access_token: '9999',
    verify_token: '5678',
    app_secret: 'X'
};

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
};


describe('FacebookBot', function() {

    // Mock the web request for getInstanceInfo()
    beforeEach(function() {
        nock(`https://${configuration.api_host}`)
            .get(`/v2.11/me?access_token=${configuration.access_token}`)
            .reply(200, {
                name: 'MOCHA-IDENTITY-NAME',
                id: 'MOCHA-IDENTITY-ID'
            });
    });

    beforeEach(function() {
        nock(`https://${badConfiguration.api_host}`)
            .get(`/v2.11/me?access_token=${badConfiguration.access_token}`)
            .reply(400);
    });

 
    describe('constructor()', function(done) {

        it('Should have a facebookbot function', function(done) {
            Botkit.should.have.property('facebookbot').which.is.a.Function();
            done();
        });

        it('FacebookBot should be an Object', function(done) {
            var facebook_bot = Botkit.facebookbot(configuration);
            facebook_bot.should.be.an.Object();
            done();

            facebook_bot.shutdown();
        });

        it('FacebookBot should have an Identity', function(done) {
            //Setup
            var facebook_bot = Botkit.facebookbot(configuration);

            // Assertions
            // getInstanceInfo returns a promise, and we need to give it some time to be fulfilled
            sleep(500).then(() => {
                facebook_bot.should.have.property('identity').which.is.an.Object();
                facebook_bot.identity.should.have.property('name', 'MOCHA-IDENTITY-NAME');
                facebook_bot.identity.should.have.property('id','MOCHA-IDENTITY-ID');
            })
            .finally(
                done(),
                facebook_bot.shutdown()
            );
        });

        it('FacebookBot should fail when it cannot obtain an identity', function(done) {
            //Setup
            var facebook_bot = Botkit.facebookbot(badConfiguration);

            // Assertions
            // getInstanceInfo returns a promise, and we need to give it some time to be fulfilled
            sleep(500).then(() => {
                facebook_bot.identity.should.fail();
            })
            .finally(
                done(),
                facebook_bot.shutdown()
            );
        });
    });

    describe('messenger profile api', function(done) {
        
        describe('home_url', function(done) {

            it('home_url should be a function', function(done) {
                var facebook_bot = Botkit.facebookbot(configuration);
                facebook_bot.api.messenger_profile.home_url.should.be.a.Function();
                done();
                facebook_bot.shutdown();
            });

            it('home_url should post a payload', function(done) {
                var facebook_bot = Botkit.facebookbot(configuration);
                var expectedPayload = {
                    home_url: {
                        url: 'https://testurl.com',
                        webview_height_ratio: 'tall',
                        in_test: true
                    }
                };

                var expectedApiCall = sinon.spy();
                facebook_bot.api.messenger_profile.postAPI = expectedApiCall;
                facebook_bot.api.messenger_profile.home_url({
                    url: 'https://testurl.com',
                    webview_height_ratio: 'tall',
                    in_test: true
                });
                expectedApiCall.should.be.calledWith(expectedPayload);
                done();
                facebook_bot.shutdown();
            });

            it('get_home_url should be a function', function(done) {
                var facebook_bot = Botkit.facebookbot(configuration);
                facebook_bot.api.messenger_profile.get_home_url.should.be.a.Function();
                done();
                facebook_bot.shutdown();
            });

            it('get_home_url should trigger a callback', function(done) {
                var facebook_bot = Botkit.facebookbot(configuration);
                var apiGet = sinon.stub(facebook_bot.api.messenger_profile, 'getAPI').callsFake(function fakeFn(fields, cb) {
                    return cb(null, {
                        "home_url" : {
                            "url": "http://petershats.com/send-a-hat",
                            "webview_height_ratio": "tall",
                            "in_test":true
                        }
                    });
                });
                facebook_bot.api.messenger_profile.get_home_url(function(err, result) {
                    done();
                });
                facebook_bot.shutdown();
            });

            it('delete_home_url should be a function', function(done) {
                var facebook_bot = Botkit.facebookbot(configuration);
                facebook_bot.api.messenger_profile.get_home_url.should.be.a.Function();
                done();
                facebook_bot.shutdown();
            });

            it('delete_home_url should trigger a delete api call', function(done) {
                var facebook_bot = Botkit.facebookbot(configuration);
                var expectedApiCall = sinon.spy();
                facebook_bot.api.messenger_profile.deleteAPI = expectedApiCall;
                facebook_bot.api.messenger_profile.delete_home_url();
                expectedApiCall.should.be.calledWith('home_url');
                done();
                facebook_bot.shutdown();
            })
        });

    });

    describe('handleWebhookPayload()', function(done) {

        it('Should be function', function(done) {
            //Setup
            var facebook_bot = Botkit.facebookbot(configuration);

            //Assertions
            facebook_bot.handleWebhookPayload.should.be.a.Function();
            done();
            facebook_bot.shutdown()
        });
    
        function mock_entry() {
            return {
                sender: {id: "SENDER_ID"},
                recipient: {id: "RECIPIENT_ID"},
                timestamp: "TIMESTAMP"
            }
        };
        var res = {};

        it('Should call receiveMessage on facebook_message.message', function(done) {
            //Setup
            var facebook_bot = Botkit.facebookbot(configuration);
            var worker = facebook_bot.spawn(configuration);

            //Spies
            facebook_bot.receiveMessage = sinon.spy();

            //Request
            var entry = mock_entry();
            entry.message = {
                text: "TEXT",
                seq:"SEQ",
                is_echo:"IS_ECHO",
                mid:"MID",
                sticker_id:"STICKER_ID",
                attachments:"ATTACHMENTS",
                quick_reply:"QUICK_REPLY"
            };
            var req = { body: { entry: [ { messaging: [ entry ] } ] } };
            facebook_bot.handleWebhookPayload(req, res, worker);

            //Assertions
            facebook_bot.receiveMessage.should.be.called();
            done();
            facebook_bot.shutdown()
        });

        it('Should trigger \'facebook_postback\' on facebook_message.postback', function(done) {
            //Setup
            var facebook_bot = Botkit.facebookbot(configuration);
            var worker = facebook_bot.spawn(configuration);

            //Spies
            facebook_bot.trigger = sinon.spy();

            //Request
            var entry = mock_entry();
            entry.postback = {
                payload: "PAYLOAD",
                referral: "REFERRAL"
            };
            var req = { body: { entry: [ { messaging: [ entry ] } ] } };
            facebook_bot.handleWebhookPayload(req, res, worker);

            //Assertions
            facebook_bot.trigger.should.be.calledWithMatch('facebook_postback');
            done();
            facebook_bot.shutdown()
        });

        it('Should trigger \'facebook_optin\' on facebook_message.optin', function(done) {
            //Setup
            var facebook_bot = Botkit.facebookbot(configuration);
            var worker = facebook_bot.spawn(configuration);

            //Spies
            facebook_bot.trigger = sinon.spy();

            //Request
            var entry = mock_entry();
            entry.optin = true;
            var req = { body: { entry: [ { messaging: [ entry ] } ] } };
            facebook_bot.handleWebhookPayload(req, res, worker);

            //Assertions
            facebook_bot.trigger.should.be.calledWithMatch('facebook_optin');
            done();
            facebook_bot.shutdown()
        });

        it('Should trigger \'message_delivered\' on facebook_message.delivery', function(done) {
            //Setup
            var facebook_bot = Botkit.facebookbot(configuration);
            var worker = facebook_bot.spawn(configuration);

            //Spies
            facebook_bot.trigger = sinon.spy();

            //Request
            var entry = mock_entry();
            entry.delivery = true;
            var req = { body: { entry: [ { messaging: [ entry ] } ] } };
            facebook_bot.handleWebhookPayload(req, res, worker);

            //Assertions
            facebook_bot.trigger.should.be.calledWithMatch('message_delivered');
            done();
            facebook_bot.shutdown()
        });

        it('Should trigger \'message_read\' on facebook_message.referral', function(done) {
            //Setup
            var facebook_bot = Botkit.facebookbot(configuration);
            var worker = facebook_bot.spawn(configuration);

            //Spies
            facebook_bot.trigger = sinon.spy();

            //Request
            var entry = mock_entry();
            entry.referral = true;
            var req = { body: { entry: [ { messaging: [ entry ] } ] } };
            facebook_bot.handleWebhookPayload(req, res, worker);

            //Assertions
            facebook_bot.trigger.should.be.calledWithMatch('facebook_referral');
            done();
            facebook_bot.shutdown()
        });
    });

});

