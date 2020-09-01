const assert = require('assert');
const { MattermostAdapter } = require('../');

describe('MattermostAdapter', function() {

    let adapter;

    beforeEach(function () {
        adapter = new MattermostAdapter({
            host: 'mattermost.example',
            port: 8065,
            botToken: '123456789'
        });
    });

    it('should not construct without required parameters', function () {
        assert.throws(function () { let adapter = new MattermostAdapter({}) }, 'Foo');
    });

    it('should create a MattermostAdapter object', function () {
        assert((adapter instanceof MattermostAdapter), 'Adapter is wrong type');
    });

});
