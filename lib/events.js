/**
 * Implement a pub sub sing the great EventEmitter2.
 * The basic interface is:
 *   trigger(event, [param1, param2, ...])
 *   on(events, function(param1, param2, ...){ ... })
 * It also log events with stack trace, when the DEBUG options are active
 **/


var EventEmitter2 = require('eventemitter2').EventEmitter2;
var debug = require('debug');


/**
 * Execute each of the listeners that may be listening for the specified event
 * name in order with the list of arguments.
 * @param {string} event - the event name
 * @param {*[]} [data] - an array of data being passed.
 **/

EventEmitter2.prototype.trigger = function(event, data) {
    var args = [event];
    if (data) for (var i in data) {
        args.push(data[i]);
    }
    EventEmitter2.prototype.emit.apply(this, args);

    // for chaining
    return this;
};

var oldOn = EventEmitter2.prototype.on;

/**
 * Callback of the on function.
 * The event name is avaiable in this.event
 *
 * @callback eventCallback
 * @param {...*} [opt] - List of arguments passed in the trigger function
 */

/**
 * Adds a listener to the end of the listeners array for the specified event.
 * Support:
 *  - simple string as one event
 *  - a comma separated string to define multiple events
 *  - an array of strings to define multiple events
 *
 * @param {string|string[]} event - the event's name or events' names
 * @param {eventCallback} eventFunction - fuction associated to the event(s)
 **/

EventEmitter2.prototype.on = function(event) {
    var events = (typeof(event) == 'string') ? event.split(/\,/g) : event;

    //For 1 or not an array
    if (!(events.length >= 2)) {
        oldOn.apply(this, arguments);
        // for chaining
        return this;
    }

    // For 2+ events
    var l = arguments.length;
    var args = new Array(l);
    for (var i = 1; i < l; i++) args[i] = arguments[i];

    for (var i in events) {
        args[0] = events[i];
        oldOn.apply(this, args);
    }

    // for chaining
    return this;
};

/**
 * Create a EventEmitter2
 * Attach also a default tracer when an event is triggered.
 *
 * @param {Object} opt - Options for eventEmitter2 constructor
 * (See https://github.com/asyncly/EventEmitter2#differences-non-breaking-compatible-with-existing-eventemitter)
 **/

EventEmitter2.create = function(opt) {
    var ret = new EventEmitter2(opt);

    var trace = false;
    if (debug.enabled('botkit:events:stackTrace:trigger')) {
        trace = true;
    }

    ret.onAny(function(event) {
      if (trace) {
          // NOTE: it is NOT an error! Just an effective way to get a trace.
          var here = new Error('The event Trace');
          debug('botkit:events:trigger:' + this.event)(arguments, here.stack);
      } else {
          debug('botkit:events:trigger:' + this.event)(arguments);
      }
  });

    return ret;
};

/**
 * Utility to add alias `functions` of a object ee in a object o
 * and create an alias of ee as o[member]
 *
 * Ex : EventEmitter2.extendObject(this, EventEmitter2.create());
 *
 * @param {Object} o - the object that receives the alias function
 * @param {Object} ee - the EventEmitter2 object to be associated with o
 * @param {string} [member] - the alias of the EventEmitter2 in o (default _EE)
 * @param {string[]} [functions] - the names of the function to be aliased
 **/

EventEmitter2.extendObject = function(o, ee, member, functions) {
    if (!member) member = '_EE';
    if (!functions) functions = ['on', 'off', 'trigger', 'many', 'once'];
    o[member] = ee;
    for (var i in functions) {
        var f = functions[i];
        // create o.on = o._EE.on ... etc
        o[f] = o[member][f].bind(o[member]);
    }
    return o;
};

module.exports = EventEmitter2;
