"use strict";
var Brain, JSObjectHandler, Parser, RiveScript, VERSION, inherit_utils, sorting, utils;

VERSION = "1.2.0";

Parser = require("./parser");

Brain = require("./brain");

utils = require("./utils");

sorting = require("./sorting");

inherit_utils = require("./inheritance");

JSObjectHandler = require("./lang/javascript");

RiveScript = (function() {
  function RiveScript(opts) {
    if (opts == null) {
      opts = {};
    }
    this._debug = opts.debug ? opts.debug : false;
    this._strict = opts.strict ? opts.strict : true;
    this._depth = opts.depth ? parseInt(opts.depth) : 50;
    this._utf8 = opts.utf8 ? opts.utf8 : false;
    this._onDebug = opts.onDebug ? opts.onDebug : null;
    this.unicodePunctuation = new RegExp(/[.,!?;:]/g);
    this._node = {};
    this._runtime = this.runtime();
    this.parser = new Parser(this);
    this.brain = new Brain(this);
    this._pending = [];
    this._loadCount = 0;
    this._global = {};
    this._var = {};
    this._sub = {};
    this._person = {};
    this._array = {};
    this._users = {};
    this._freeze = {};
    this._includes = {};
    this._inherits = {};
    this._handlers = {};
    this._objlangs = {};
    this._topics = {};
    this._thats = {};
    this._sorted = {};
    if (typeof opts === "object") {
      if (opts.debug) {
        this._debug = true;
      }
      if (opts.strict) {
        this._strict = true;
      }
      if (opts.depth) {
        this._depth = parseInt(opts.depth);
      }
      if (opts.utf8) {
        this._utf8 = true;
      }
    }
    this._handlers.javascript = new JSObjectHandler(this);
    this.say("RiveScript Interpreter v" + VERSION + " Initialized.");
    this.say("Runtime Environment: " + this._runtime);
  }

  RiveScript.prototype.version = function() {
    return VERSION;
  };

  RiveScript.prototype.runtime = function() {
    if (typeof window === "undefined" && typeof module === "object") {
      this._node.fs = require("fs");
      return "node";
    }
    return "web";
  };

  RiveScript.prototype.say = function(message) {
    if (this._debug !== true) {
      return;
    }
    if (this._onDebug) {
      return this._onDebug(message);
    } else {
      return console.log(message);
    }
  };

  RiveScript.prototype.warn = function(message, filename, lineno) {
    if ((filename != null) && (lineno != null)) {
      message += " at " + filename + " line " + lineno;
    }
    if (this._onDebug) {
      return this._onDebug("[WARNING] " + message);
    } else if (console) {
      if (console.error) {
        return console.error(message);
      } else {
        return console.log("[WARNING] " + message);
      }
    } else if (window) {
      return window.alert(message);
    }
  };

  RiveScript.prototype.loadFile = function(path, onSuccess, onError) {
    var file, i, len, loadCount;
    if (typeof path === "string") {
      path = [path];
    }
    loadCount = this._loadCount++;
    this._pending[loadCount] = {};
    for (i = 0, len = path.length; i < len; i++) {
      file = path[i];
      this.say("Request to load file: " + file);
      this._pending[loadCount][file] = 1;
      if (this._runtime === "web") {
        this._ajaxLoadFile(loadCount, file, onSuccess, onError);
      } else {
        this._nodeLoadFile(loadCount, file, onSuccess, onError);
      }
    }
    return loadCount;
  };

  RiveScript.prototype._ajaxLoadFile = function(loadCount, file, onSuccess, onError) {
    return $.ajax({
      url: file,
      dataType: "text",
      success: (function(_this) {
        return function(data, textStatus, xhr) {
          _this.say("Loading file " + file + " complete.");
          _this.parse(file, data, onError);
          delete _this._pending[loadCount][file];
          if (Object.keys(_this._pending[loadCount]).length === 0) {
            if (typeof onSuccess === "function") {
              return onSuccess.call(void 0, loadCount);
            }
          }
        };
      })(this),
      error: (function(_this) {
        return function(xhr, textStatus, errorThrown) {
          _this.say("Ajax error! " + textStatus + "; " + errorThrown);
          if (typeof onError === "function") {
            return onError.call(void 0, textStatus, loadCount);
          }
        };
      })(this)
    });
  };

  RiveScript.prototype._nodeLoadFile = function(loadCount, file, onSuccess, onError) {
    return this._node.fs.readFile(file, (function(_this) {
      return function(err, data) {
        if (err) {
          if (typeof onError === "function") {
            onError.call(void 0, err, loadCount);
          } else {
            _this.warn(err);
          }
          return;
        }
        _this.parse(file, "" + data, onError);
        delete _this._pending[loadCount][file];
        if (Object.keys(_this._pending[loadCount]).length === 0) {
          if (typeof onSuccess === "function") {
            return onSuccess.call(void 0, loadCount);
          }
        }
      };
    })(this));
  };

  RiveScript.prototype.loadDirectory = function(path, onSuccess, onError) {
    var loadCount;
    if (this._runtime === "web") {
      this.warn("loadDirectory can't be used on the web!");
      return;
    }
    loadCount = this._loadCount++;
    this._pending[loadCount] = {};
    this.say("Loading batch " + loadCount + " from directory " + path);
    return this._node.fs.readdir(path, (function(_this) {
      return function(err, files) {
        var file, i, j, len, len1, results, toLoad;
        if (err) {
          if (typeof onError === "function") {
            onError.call(void 0, err);
          } else {
            _this.warn(err);
          }
          return;
        }
        toLoad = [];
        for (i = 0, len = files.length; i < len; i++) {
          file = files[i];
          if (file.match(/\.(rive|rs)$/i)) {
            _this._pending[loadCount][path + "/" + file] = 1;
            toLoad.push(path + "/" + file);
          }
        }
        results = [];
        for (j = 0, len1 = toLoad.length; j < len1; j++) {
          file = toLoad[j];
          _this.say("Parsing file " + file + " from directory");
          results.push(_this._nodeLoadFile(loadCount, file, onSuccess, onError));
        }
        return results;
      };
    })(this));
  };

  RiveScript.prototype.stream = function(code, onError) {
    this.say("Streaming code.");
    return this.parse("stream()", code, onError);
  };

  RiveScript.prototype.parse = function(filename, code, onError) {
    var ast, data, i, internal, j, len, len1, name, object, ref, ref1, ref2, ref3, results, topic, trigger, type, value, vars;
    this.say("Parsing code!");
    ast = this.parser.parse(filename, code, onError);
    ref = ast.begin;
    for (type in ref) {
      vars = ref[type];
      if (!ast.begin.hasOwnProperty(type)) {
        continue;
      }
      internal = "_" + type;
      for (name in vars) {
        value = vars[name];
        if (!vars.hasOwnProperty(name)) {
          continue;
        }
        if (value === "<undef>") {
          delete this[internal][name];
        } else {
          this[internal][name] = value;
        }
      }
      if (this._global.debug != null) {
        this._debug = this._global.debug === "true" ? true : false;
      }
      if (this._global.depth != null) {
        this._depth = parseInt(this._global.depth) || 50;
      }
    }
    ref1 = ast.topics;
    for (topic in ref1) {
      data = ref1[topic];
      if (!ast.topics.hasOwnProperty(topic)) {
        continue;
      }
      if (this._includes[topic] == null) {
        this._includes[topic] = {};
      }
      if (this._inherits[topic] == null) {
        this._inherits[topic] = {};
      }
      utils.extend(this._includes[topic], data.includes);
      utils.extend(this._inherits[topic], data.inherits);
      if (this._topics[topic] == null) {
        this._topics[topic] = [];
      }
      ref2 = data.triggers;
      for (i = 0, len = ref2.length; i < len; i++) {
        trigger = ref2[i];
        this._topics[topic].push(trigger);
        if (trigger.previous != null) {
          if (this._thats[topic] == null) {
            this._thats[topic] = {};
          }
          if (this._thats[topic][trigger.trigger] == null) {
            this._thats[topic][trigger.trigger] = {};
          }
          this._thats[topic][trigger.trigger][trigger.previous] = trigger;
        }
      }
    }
    ref3 = ast.objects;
    results = [];
    for (j = 0, len1 = ref3.length; j < len1; j++) {
      object = ref3[j];
      if (this._handlers[object.language]) {
        this._objlangs[object.name] = object.language;
        results.push(this._handlers[object.language].load(object.name, object.code));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  RiveScript.prototype.sortReplies = function() {
    var allTriggers, thatTriggers, topic;
    this._sorted.topics = {};
    this._sorted.thats = {};
    this.say("Sorting triggers...");
    for (topic in this._topics) {
      if (!this._topics.hasOwnProperty(topic)) {
        continue;
      }
      this.say("Analyzing topic " + topic + "...");
      allTriggers = inherit_utils.getTopicTriggers(this, topic);
      this._sorted.topics[topic] = sorting.sortTriggerSet(allTriggers, true);
      thatTriggers = inherit_utils.getTopicTriggers(this, topic, true);
      this._sorted.thats[topic] = sorting.sortTriggerSet(thatTriggers, false);
    }
    this._sorted.sub = sorting.sortList(Object.keys(this._sub));
    return this._sorted.person = sorting.sortList(Object.keys(this._person));
  };

  RiveScript.prototype.deparse = function() {
    var result;
    result = {
      begin: {
        global: utils.clone(this._global),
        "var": utils.clone(this._var),
        sub: utils.clone(this._sub),
        person: utils.clone(this._person),
        array: utils.clone(this._array),
        triggers: []
      },
      topics: utils.clone(this._topics),
      inherits: utils.clone(this._inherits),
      includes: utils.clone(this._includes)
    };
    if (result.topics.__begin__ != null) {
      result.begin.triggers = result.topics.__begin__;
      delete result.topics.__begin__;
    }
    if (this._debug) {
      result.begin.global.debug = this._debug;
    }
    if (this._depth !== 50) {
      result.begin.global.depth = this._depth;
    }
    return result;
  };

  RiveScript.prototype.stringify = function(deparsed) {
    return this.parser.stringify(deparsed);
  };

  RiveScript.prototype.write = function(filename, deparsed) {
    if (this._runtime === "web") {
      this.warn("write() can't be used on the web!");
      return;
    }
    return this._node.fs.writeFile(filename, this.stringify(deparsed), function(err) {
      if (err) {
        return this.warn("Error writing to file " + filename + ": " + err);
      }
    });
  };

  RiveScript.prototype.setHandler = function(lang, obj) {
    if (obj === void 0) {
      return delete this._handlers[lang];
    } else {
      return this._handlers[lang] = obj;
    }
  };

  RiveScript.prototype.setSubroutine = function(name, code) {
    if (this._handlers.javascript) {
      this._objlangs[name] = "javascript";
      return this._handlers.javascript.load(name, code);
    }
  };

  RiveScript.prototype.setGlobal = function(name, value) {
    if (value === void 0) {
      return delete this._global[name];
    } else {
      return this._global[name] = value;
    }
  };

  RiveScript.prototype.setVariable = function(name, value) {
    if (value === void 0) {
      return delete this._var[name];
    } else {
      return this._var[name] = value;
    }
  };

  RiveScript.prototype.setSubstitution = function(name, value) {
    if (value === void 0) {
      return delete this._sub[name];
    } else {
      return this._sub[name] = value;
    }
  };

  RiveScript.prototype.setPerson = function(name, value) {
    if (value === void 0) {
      return delete this._person[name];
    } else {
      return this._person[name] = value;
    }
  };

  RiveScript.prototype.setUservar = function(user, name, value) {
    if (!this._users[user]) {
      this._users[user] = {
        topic: "random"
      };
    }
    if (value === void 0) {
      return delete this._users[user][name];
    } else {
      return this._users[user][name] = value;
    }
  };

  RiveScript.prototype.setUservars = function(user, data) {
    var key, results;
    if (!this._users[user]) {
      this._users[user] = {
        topic: "random"
      };
    }
    results = [];
    for (key in data) {
      if (!data.hasOwnProperty(key)) {
        continue;
      }
      if (data[key] === void 0) {
        results.push(delete this._users[user][key]);
      } else {
        results.push(this._users[user][key] = data[key]);
      }
    }
    return results;
  };

  RiveScript.prototype.getVariable = function(user, name) {
    if (typeof this._var[name] !== "undefined") {
      return this._var[name];
    } else {
      return "undefined";
    }
  };

  RiveScript.prototype.getUservar = function(user, name) {
    if (!this._users[user]) {
      return "undefined";
    }
    if (typeof this._users[user][name] !== "undefined") {
      return this._users[user][name];
    } else {
      return "undefined";
    }
  };

  RiveScript.prototype.getUservars = function(user) {
    if (user === void 0) {
      return utils.clone(this._users);
    } else {
      if (this._users[user] != null) {
        return utils.clone(this._users[user]);
      }
      return void 0;
    }
  };

  RiveScript.prototype.clearUservars = function(user) {
    if (user === void 0) {
      return this._users = {};
    } else {
      return delete this._users[user];
    }
  };

  RiveScript.prototype.freezeUservars = function(user) {
    if (this._users[user] != null) {
      return this._freeze[user] = utils.clone(this._users[user]);
    } else {
      return this.warn("Can't freeze vars for user " + user + ": not found!");
    }
  };

  RiveScript.prototype.thawUservars = function(user, action) {
    if (action == null) {
      action = "thaw";
    }
    if (typeof action !== "string") {
      action = "thaw";
    }
    if (this._freeze[user] == null) {
      this.warn("Can't thaw user vars: " + user + " wasn't frozen!");
      return;
    }
    if (action === "thaw") {
      this.clearUservars(user);
      this._users[user] = utils.clone(this._freeze[user]);
      return delete this._freeze[user];
    } else if (action === "discard") {
      return delete this._freeze[user];
    } else if (action === "keep") {
      this.clearUservars(user);
      return this._users[user] = utils.clone(this._freeze[user]);
    } else {
      return this.warn("Unsupported thaw action!");
    }
  };

  RiveScript.prototype.lastMatch = function(user) {
    if (this._users[user] != null) {
      return this._users[user].__lastmatch__;
    }
    return void 0;
  };

  RiveScript.prototype.currentUser = function() {
    if (this.brain._currentUser === void 0) {
      this.warn("currentUser() is intended to be called from within a JS object macro!");
    }
    return this.brain._currentUser;
  };

  RiveScript.prototype.reply = function(user, msg, scope) {
    return this.brain.reply(user, msg, scope);
  };

  return RiveScript;

})();

module.exports = RiveScript;
