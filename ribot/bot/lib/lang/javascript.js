"use strict";
var JSObjectHandler;

JSObjectHandler = (function() {
  function JSObjectHandler(master) {
    this._master = master;
    this._objects = {};
  }

  JSObjectHandler.prototype.load = function(name, code) {
    var e, source;
    source = "this._objects[\"" + name + "\"] = function(rs, args) {\n" + code.join("\n") + "}\n";
    try {
      return eval(source);
    } catch (_error) {
      e = _error;
      return this._master.warn("Error evaluating JavaScript object: " + e.message);
    }
  };

  JSObjectHandler.prototype.call = function(rs, name, fields, scope) {
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
      reply = "[ERR: Error when executing JavaScript object: " + e.message + "]";
    }
    if (reply === void 0) {
      reply = "";
    }
    return reply;
  };

  return JSObjectHandler;

})();

module.exports = JSObjectHandler;
