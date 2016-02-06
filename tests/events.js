var should = require('should');
var EE = require('../lib/events.js');

describe('Test events', function() {
    it('should create an EventEmitter2', function(done) {
        var ev = EE.create();
        should(ev).be.an.Object(ev);
        done();
    });

    it('should trigger an event', function(done) {
        var ev = EE.create();
        ev.on('event1', function(param) {
            done();
        });
        ev.trigger('event1');
    });

    it('should trigger two differnt events defined as a comma separated string', function(done) {
        var ev = EE.create();
        var eventsLeft = 2;
        ev.on('event2,event3', function(param) {
            eventsLeft--;
            should(param).be.equalOneOf([11, 12]);
            if (eventsLeft == 0) done();
        });
        ev.trigger('event2', [11]);
        ev.trigger('event3', [12]);
    });

    it('should trigger two differnt events defined as an array', function(done) {
        var ev = EE.create();
        var eventsLeft = 2;
        ev.on(['event4', 'event5'], function(param) {
            eventsLeft--;
            should(param).be.equalOneOf([21, 22]);
            if (eventsLeft == 0) done();
        });
        ev.trigger('event5', [22]);
        ev.trigger('event4', [21]);
    });

    it('should extend an object', function(done) {
        var MyObject = function() {
            EE.extendObject(this, EE.create());
        };

        var myObject = new MyObject();

        should(myObject).have.ownProperty('_EE');

        var eventsLeft = 2;
        myObject.on(['event6', 'event7'], function(param) {
            eventsLeft--;
            should(param).be.equalOneOf([25, 26]);
            if (eventsLeft == 0) done();
        });
        // Trigger on the main object
        myObject.trigger('event6', [25]);
        // Trigger on the EventEmitter member
        myObject._EE.trigger('event7', [26]);
    });
});
