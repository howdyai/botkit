const assert = require('assert');
const { Botkit } = require('../');

describe('Botkit', function() {
    it('should create a Botkit controller', function() {
        assert((new Botkit({ disable_console: true, disable_webserver: true }) instanceof Botkit), 'Botkit is wrong type');
    });
});
