"use strict";
var CoffeeObjectHandler, coffee;

coffee = require("coffee-script");

CoffeeObjectHandler = (function() {
  function CoffeeObjectHandler(master) {
    this._master = master;
    this._objects = {};
  }

  CoffeeObjectHandler.prototype.load = function(name, code) {
    var e, source;
    source = "this._objects[\"" + name + "\"] = function(rs, args) {\n" + coffee.compile(code.join("\n"), {
      bare: true
    }) + "}\n";
    try {
      return eval(source);
    } catch (_error) {
      e = _error;
      return this._master.warn("Error evaluating CoffeeScript object: " + e.message);
    }
  };

  CoffeeObjectHandler.prototype.call = function(rs, name, fields, scope) {
    var e, func, reply;
    if (!this._objects[name]) {
      return "[ERR: Object Not Found]";
    }
    func = this._objects[name];
    reply = "";
    try {
      reply = func.call(scope, rs, fields);
    } catch (_error) {
      e = _error;
      reply = "[ERR: Error when executing CoffeeScript object: " + e.message + "]";
    }
    if (reply === void 0) {
      reply = "";
    }
    return reply;
  };

  return CoffeeObjectHandler;

})();

module.exports = CoffeeObjectHandler;
