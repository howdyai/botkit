const assert = require('assert');
const { WebAdapter } = require('../');

describe('WebAdapter', function() {

    let adapter;

    beforeEach(function () {
        adapter = new WebAdapter({
        });
    });

    it('should contruct without any parameters (none are required)', function () {
        assert.doesNotThrow(function () { let adapter = new WebAdapter({}); }, 'Foo');
    });

    it('should create a WebAdapter object', function () {
        assert((adapter instanceof WebAdapter), 'Adapter is wrong type');
    });

});
