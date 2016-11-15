/* global describe it */

var should = require('should');
var util = require('../lib/util');

describe('An incomplete object', function() {
    var storage = {
        teams: {
            get: function() {},
            save: function() {}
        }
    };
    it('should raise an error', function() {
        should.throws(function() {
            util.ensureMethodsArePresent('storage', storage, ['teams.get', 'teams.save', 'users.get', 'users.save']);
        });
    });
});

describe('A complete object', function() {
    var logger = {
        log: function() {}
    };
    it('should not raise an error', function() {
        util.ensureMethodsArePresent('logger', logger, ['log']);
    });
});
