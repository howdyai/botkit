const assert = require('assert');
const { Botkit } = require('../');

describe('Botkit', function() {

    it('should create a Botkit controller', function () {
        assert((new Botkit({}) instanceof Botkit), 'Botkit is wrong type');
    });
});
