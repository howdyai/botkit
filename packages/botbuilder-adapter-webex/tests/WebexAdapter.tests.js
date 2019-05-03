const assert = require('assert');
const { WebexAdapter } = require('../');

describe('WebexAdapter', function() {

    let adapter;

    beforeEach(function () {
        adapter = new WebexAdapter({
            access_token: '123123123',
            secret: '123',
            public_address: 'https://fakebot.com'
        });
    });

    it('should not construct without required parameters', function () {
        assert.throws(function () { let adapter = new WebexAdapter({}) }, 'Foo');
    });

    it('should create a WebexAdapter object', function () {
        assert((adapter instanceof WebexAdapter), 'Adapter is wrong type');
    });

});
