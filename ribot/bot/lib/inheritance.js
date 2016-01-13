var getTopicTree, getTopicTriggers;

getTopicTriggers = function(rs, topic, thats, depth, inheritance, inherited) {
  var curTrig, i, inThisTopic, includes, inherits, j, len, len1, previous, ref, trigger, triggers;
  if (thats == null) {
    thats = false;
  }
  if (depth == null) {
    depth = 0;
  }
  if (inheritance == null) {
    inheritance = 0;
  }
  if (inherited == null) {
    inherited = 0;
  }
  if (depth > rs._depth) {
    rs.warn("Deep recursion while scanning topic inheritance!");
    return [];
  }
  rs.say(("Collecting trigger list for topic " + topic + " (depth=" + depth + "; ") + ("inheritance=" + inheritance + "; inherited=" + inherited + ")"));
  if (rs._topics[topic] == null) {
    rs.warn(("Inherited or included topic '" + topic + "' doesn't exist or ") + "has no triggers");
    return [];
  }
  triggers = [];
  inThisTopic = [];
  if (!thats) {
    if (rs._topics[topic] != null) {
      ref = rs._topics[topic];
      for (i = 0, len = ref.length; i < len; i++) {
        trigger = ref[i];
        inThisTopic.push([trigger.trigger, trigger]);
      }
    }
  } else {
    if (rs._thats[topic] != null) {
      for (curTrig in rs._thats[topic]) {
        if (!rs._thats[topic].hasOwnProperty(curTrig)) {
          continue;
        }
        for (previous in rs._thats[topic][curTrig]) {
          if (!rs._thats[topic][curTrig].hasOwnProperty(previous)) {
            continue;
          }
          inThisTopic.push([previous, rs._thats[topic][curTrig][previous]]);
        }
      }
    }
  }
  if (Object.keys(rs._includes[topic]).length > 0) {
    for (includes in rs._includes[topic]) {
      if (!rs._includes[topic].hasOwnProperty(includes)) {
        continue;
      }
      rs.say("Topic " + topic + " includes " + includes);
      triggers.push.apply(triggers, getTopicTriggers(rs, includes, thats, depth + 1, inheritance + 1, false));
    }
  }
  if (Object.keys(rs._inherits[topic]).length > 0) {
    for (inherits in rs._inherits[topic]) {
      if (!rs._inherits[topic].hasOwnProperty(inherits)) {
        continue;
      }
      rs.say("Topic " + topic + " inherits " + inherits);
      triggers.push.apply(triggers, getTopicTriggers(rs, inherits, thats, depth + 1, inheritance + 1, true));
    }
  }
  if (Object.keys(rs._inherits[topic]).length > 0 || inherited) {
    for (j = 0, len1 = inThisTopic.length; j < len1; j++) {
      trigger = inThisTopic[j];
      rs.say("Prefixing trigger with {inherits=" + inheritance + "} " + trigger);
      triggers.push.apply(triggers, [["{inherits=" + inheritance + "}" + trigger[0], trigger[1]]]);
    }
  } else {
    triggers.push.apply(triggers, inThisTopic);
  }
  return triggers;
};

getTopicTree = function(rs, topic, depth) {
  var includes, inherits, topics;
  if (depth == null) {
    depth = 0;
  }
  if (depth > rs._depth) {
    rs.warn("Deep recursion while scanning topic tree!");
    return [];
  }
  topics = [topic];
  for (includes in rs._topics[topic].includes) {
    if (!rs._topics[topic].includes.hasOwnProperty(includes)) {
      continue;
    }
    topics.push.apply(topics, getTopicTree(rs, includes, depth + 1));
  }
  for (inherits in rs._topics[topic].inherits) {
    if (!rs._topics[topic].inherits.hasOwnProperty(inherits)) {
      continue;
    }
    topics.push.apply(topics, getTopicTree(rs, inherits, depth + 1));
  }
  return topics;
};

exports.getTopicTriggers = getTopicTriggers;

exports.getTopicTree = getTopicTree;
