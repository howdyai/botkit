const assert = require('assert');
const { HangoutsAdapter } = require('../');

describe('HangoutsAdapter', function() {
    let adapter;

    // beforeEach(function () {
    //     adapter = new HangoutsAdapter({
    //         token: '123',
    //     });
    // });

    it('should not require construction parameters', function() {
        assert.doesNotThrow(() => new HangoutsAdapter({}), 'Foo');
    });

    // it('should create a HangoutsAdapter object', function () {
    //     assert((adapter instanceof HangoutsAdapter), 'Adapter is wrong type');
    // });
});
