const assert = require('assert');
const { SlackAdapter } = require('../');

describe('SlackAdapter', function() {

    let adapter;

    beforeEach(function () {
        adapter = new SlackAdapter({
            clientSigningSecret: '123',
            clientId: '123',
            clientSecret: '123',
            scopes: ['bot'],
            redirectUri: 'https://fake.com/install/auth',
            getBotUserByTeam: async(team) => '123',
            getTokenForTeam: async(team) => '123',
        });
    });

    it('should not construct without required parameters', function () {
        assert.throws(function () { let adapter = new SlackAdapter({}) }, 'Foo');
    });

    it('should create a SlackAdapter object', function () {
        assert((adapter instanceof SlackAdapter), 'Adapter is wrong type');
    });

});
