exports.strip = function(text) {
  text = text.replace(/^[\s\t]+/, "").replace(/[\s\t]+$/, "").replace(/[\x0D\x0A]+/, "");
  return text;
};

exports.extend = function(a, b) {
  var attr, results, value;
  results = [];
  for (attr in b) {
    value = b[attr];
    if (!b.hasOwnProperty(attr)) {
      continue;
    }
    results.push(a[attr] = value);
  }
  return results;
};

exports.word_count = function(trigger, all) {
  var i, len, wc, word, words;
  words = [];
  if (all) {
    words = trigger.split(/\s+/);
  } else {
    words = trigger.split(/[\s\*\#\_\|]+/);
  }
  wc = 0;
  for (i = 0, len = words.length; i < len; i++) {
    word = words[i];
    if (word.length > 0) {
      wc++;
    }
  }
  return wc;
};

exports.stripNasties = function(string, utf8) {
  if (utf8) {
    string = string.replace(/[\\<>]+/g, "");
    return string;
  }
  string = string.replace(/[^A-Za-z0-9 ]/g, "");
  return string;
};

exports.quotemeta = function(string) {
  var char, i, len, unsafe;
  unsafe = "\\.+*?[^]$(){}=!<>|:".split("");
  for (i = 0, len = unsafe.length; i < len; i++) {
    char = unsafe[i];
    string = string.replace(new RegExp("\\" + char, "g"), "\\" + char);
  }
  return string;
};

exports.isAtomic = function(trigger) {
  var i, len, ref, special;
  ref = ["*", "#", "_", "(", "[", "<", "@"];
  for (i = 0, len = ref.length; i < len; i++) {
    special = ref[i];
    if (trigger.indexOf(special) > -1) {
      return false;
    }
  }
  return true;
};

exports.stringFormat = function(type, string) {
  var first, i, len, result, word, words;
  if (type === "uppercase") {
    return string.toUpperCase();
  } else if (type === "lowercase") {
    return string.toLowerCase();
  } else if (type === "sentence") {
    string += "";
    first = string.charAt(0).toUpperCase();
    return first + string.substring(1);
  } else if (type === "formal") {
    words = string.split(/\s+/);
    result = [];
    for (i = 0, len = words.length; i < len; i++) {
      word = words[i];
      first = word.charAt(0).toUpperCase();
      result.push(first + word.substring(1));
    }
    return result.join(" ");
  }
  return content;
};

exports.clone = function(obj) {
  var copy, key;
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  copy = obj.constructor();
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    copy[key] = exports.clone(obj[key]);
  }
  return copy;
};
