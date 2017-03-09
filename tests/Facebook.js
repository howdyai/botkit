var should = require('should');
var sinon = require('sinon');
require('should-sinon');
var winston = require('winston');
var Botkit = require('../lib/Botkit.js');

describe('FacebookBot', function() {
    describe('constructor()', function(done) {
        it('Should have a facebookbot function', function(done) {
            Botkit.should.have.property('facebookbot').which.is.a.Function();
            done();
        });

        it('FacebookBot should be an Object', function(done) {
            var facebook_bot = Botkit.facebookbot({});
            facebook_bot.should.be.an.Object();
            done();
        });
    });


    describe('handleWebhookPayload()', function(done) {
        it('Should be function', function(done) {
            //Setup
            var facebook_bot = Botkit.facebookbot({});

            //Assertions
            facebook_bot.handleWebhookPayload.should.be.a.Function();
            done();
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
            var facebook_bot = Botkit.facebookbot({});

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
            facebook_bot.handleWebhookPayload(req, res, facebook_bot);

            //Assertions
            facebook_bot.receiveMessage.should.be.called();
            done();
        });

        it('Should trigger \'facebook_postback\' on facebook_message.postback', function(done) {
            //Setup
            var facebook_bot = Botkit.facebookbot({});

            //Spies
            facebook_bot.trigger = sinon.spy();

            //Request
            var entry = mock_entry();
            entry.postback = {
                payload: "PAYLOAD",
                referral: "REFERRAL"
            };
            var req = { body: { entry: [ { messaging: [ entry ] } ] } };
            facebook_bot.handleWebhookPayload(req, res, facebook_bot);

            //Assertions
            facebook_bot.trigger.should.be.calledWithMatch('facebook_postback');
            done();
        });

        it('Should trigger \'facebook_optin\' on facebook_message.optin', function(done) {
            //Setup
            var facebook_bot = Botkit.facebookbot({});

            //Spies
            facebook_bot.trigger = sinon.spy();

            //Request
            var entry = mock_entry();
            entry.optin = true;
            var req = { body: { entry: [ { messaging: [ entry ] } ] } };
            facebook_bot.handleWebhookPayload(req, res, facebook_bot);

            //Assertions
            facebook_bot.trigger.should.be.calledWithMatch('facebook_optin');
            done();
        });

        it('Should trigger \'message_delivered\' on facebook_message.delivery', function(done) {
            //Setup
            var facebook_bot = Botkit.facebookbot({});

            //Spies
            facebook_bot.trigger = sinon.spy();

            //Request
            var entry = mock_entry();
            entry.delivery = true;
            var req = { body: { entry: [ { messaging: [ entry ] } ] } };
            facebook_bot.handleWebhookPayload(req, res, facebook_bot);

            //Assertions
            facebook_bot.trigger.should.be.calledWithMatch('message_delivered');
            done();
        });

        it('Should trigger \'message_read\' on facebook_message.referral', function(done) {
            //Setup
            var facebook_bot = Botkit.facebookbot({});

            //Spies
            facebook_bot.trigger = sinon.spy();

            //Request
            var entry = mock_entry();
            entry.referral = true;
            var req = { body: { entry: [ { messaging: [ entry ] } ] } };
            facebook_bot.handleWebhookPayload(req, res, facebook_bot);

            //Assertions
            facebook_bot.trigger.should.be.calledWithMatch('facebook_referral');
            done();
        });
    });
});
