var initSortTrack, utils;

utils = require("./utils");

exports.sortTriggerSet = function(triggers, exclude_previous, say) {
  var cnt, highest_inherits, i, inherits, ip, j, k, kind, kind_sorted, l, len, len1, len2, len3, len4, len5, m, match, n, p, pattern, pound_sorted, prior, prior_sort, ref, ref1, running, sorted_by_length, star_sorted, track, track_sorted, trig, under_sorted, weight, wordcnt;
  if (say == null) {
    say = function(what) {};
  }
  if (exclude_previous == null) {
    exclude_previous = true;
  }
  prior = {
    "0": []
  };
  for (i = 0, len = triggers.length; i < len; i++) {
    trig = triggers[i];
    if (exclude_previous && (trig[1].previous != null)) {
      continue;
    }
    match = trig[0].match(/\{weight=(\d+)\}/i);
    weight = 0;
    if (match && match[1]) {
      weight = match[1];
    }
    if (prior[weight] == null) {
      prior[weight] = [];
    }
    prior[weight].push(trig);
  }
  running = [];
  prior_sort = Object.keys(prior).sort(function(a, b) {
    return b - a;
  });
  for (j = 0, len1 = prior_sort.length; j < len1; j++) {
    p = prior_sort[j];
    say("Sorting triggers with priority " + p);
    inherits = -1;
    highest_inherits = -1;
    track = {};
    track[inherits] = initSortTrack();
    ref = prior[p];
    for (k = 0, len2 = ref.length; k < len2; k++) {
      trig = ref[k];
      pattern = trig[0];
      say("Looking at trigger: " + pattern);
      match = pattern.match(/\{inherits=(\d+)\}/i);
      if (match) {
        inherits = parseInt(match[1]);
        if (inherits > highest_inherits) {
          highest_inherits = inherits;
        }
        say("Trigger belongs to a topic that inherits other topics. Level=" + inherits);
        pattern = pattern.replace(/\{inherits=\d+\}/ig, "");
        trig[0] = pattern;
      } else {
        inherits = -1;
      }
      if (track[inherits] == null) {
        track[inherits] = initSortTrack();
      }
      if (pattern.indexOf("_") > -1) {
        cnt = utils.word_count(pattern);
        say("Has a _ wildcard with " + cnt + " words.");
        if (cnt > 0) {
          if (track[inherits].alpha[cnt] == null) {
            track[inherits].alpha[cnt] = [];
          }
          track[inherits].alpha[cnt].push(trig);
        } else {
          track[inherits].under.push(trig);
        }
      } else if (pattern.indexOf("#") > -1) {
        cnt = utils.word_count(pattern);
        say("Has a # wildcard with " + cnt + " words.");
        if (cnt > 0) {
          if (track[inherits].number[cnt] == null) {
            track[inherits].number[cnt] = [];
          }
          track[inherits].number[cnt].push(trig);
        } else {
          track[inherits].pound.push(trig);
        }
      } else if (pattern.indexOf("*") > -1) {
        cnt = utils.word_count(pattern);
        say("Has a * wildcard with " + cnt + " words.");
        if (cnt > 0) {
          if (track[inherits].wild[cnt] == null) {
            track[inherits].wild[cnt] = [];
          }
          track[inherits].wild[cnt].push(trig);
        } else {
          track[inherits].star.push(trig);
        }
      } else if (pattern.indexOf("[") > -1) {
        cnt = utils.word_count(pattern);
        say("Has optionals with " + cnt + " words.");
        if (track[inherits].option[cnt] == null) {
          track[inherits].option[cnt] = [];
        }
        track[inherits].option[cnt].push(trig);
      } else {
        cnt = utils.word_count(pattern);
        say("Totally atomic trigger with " + cnt + " words.");
        if (track[inherits].atomic[cnt] == null) {
          track[inherits].atomic[cnt] = [];
        }
        track[inherits].atomic[cnt].push(trig);
      }
    }
    track[highest_inherits + 1] = track['-1'];
    delete track['-1'];
    track_sorted = Object.keys(track).sort(function(a, b) {
      return a - b;
    });
    for (l = 0, len3 = track_sorted.length; l < len3; l++) {
      ip = track_sorted[l];
      say("ip=" + ip);
      ref1 = ["atomic", "option", "alpha", "number", "wild"];
      for (m = 0, len4 = ref1.length; m < len4; m++) {
        kind = ref1[m];
        kind_sorted = Object.keys(track[ip][kind]).sort(function(a, b) {
          return b - a;
        });
        for (n = 0, len5 = kind_sorted.length; n < len5; n++) {
          wordcnt = kind_sorted[n];
          sorted_by_length = track[ip][kind][wordcnt].sort(function(a, b) {
            return b.length - a.length;
          });
          running.push.apply(running, sorted_by_length);
        }
      }
      under_sorted = track[ip].under.sort(function(a, b) {
        return b.length - a.length;
      });
      pound_sorted = track[ip].pound.sort(function(a, b) {
        return b.length - a.length;
      });
      star_sorted = track[ip].star.sort(function(a, b) {
        return b.length - a.length;
      });
      running.push.apply(running, under_sorted);
      running.push.apply(running, pound_sorted);
      running.push.apply(running, star_sorted);
    }
  }
  return running;
};

exports.sortList = function(items) {
  var bylen, cnt, count, i, item, j, len, len1, output, sorted, track;
  track = {};
  for (i = 0, len = items.length; i < len; i++) {
    item = items[i];
    cnt = utils.word_count(item, true);
    if (track[cnt] == null) {
      track[cnt] = [];
    }
    track[cnt].push(item);
  }
  output = [];
  sorted = Object.keys(track).sort(function(a, b) {
    return b - a;
  });
  for (j = 0, len1 = sorted.length; j < len1; j++) {
    count = sorted[j];
    bylen = track[count].sort(function(a, b) {
      return b.length - a.length;
    });
    output.push.apply(output, bylen);
  }
  return output;
};

initSortTrack = function() {
  return {
    atomic: {},
    option: {},
    alpha: {},
    number: {},
    wild: {},
    pound: [],
    under: [],
    star: []
  };
};
