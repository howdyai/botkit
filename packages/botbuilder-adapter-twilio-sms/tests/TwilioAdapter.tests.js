const assert = require('assert');
const { TwilioAdapter } = require('../');

describe('TwilioAdapter', function() {

    let adapter;

    beforeEach(function () {
        adapter = new TwilioAdapter({
            twilio_number: '14155551212',
            account_sid: 'AC123123',
            auth_token: '123123',
        });
    });

    it('should not construct without required parameters', function () {
        assert.throws(function () { let adapter = new TwilioAdapter({}) }, 'Foo');
    });

    it('should create a TwilioAdapter object', function () {
        assert((adapter instanceof TwilioAdapter), 'Adapter is wrong type');
    });

});
