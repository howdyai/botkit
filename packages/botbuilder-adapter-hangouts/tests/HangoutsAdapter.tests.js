const assert = require('assert');
const { HangoutsAdapter } = require('../');

describe('HangoutsAdapter', function() {

    let adapter;

    // beforeEach(function () {
    //     adapter = new HangoutsAdapter({
    //         token: '123',
    //     });
    // });

    it('should not construct without required parameters', function () {
        assert.throws(function () { let adapter = new HangoutsAdapter({}) }, 'Foo');
    });

    // it('should create a HangoutsAdapter object', function () {
    //     assert((adapter instanceof HangoutsAdapter), 'Adapter is wrong type');
    // });

});
