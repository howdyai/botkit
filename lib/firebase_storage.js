var Firebase = require("firebase");

module.exports = function(config) {

  if (!config) {
    config = {
      url: "https://botkit-example.firebaseio.com"
    }
  }
  
  var rootRef = new Firebase(config.url);
  var teamsRef = rootRef.child("teams");
  var usersRef = rootRef.child("users");
  var channelsRef = rootRef.child("channels");

  var get = function(firebaseRef){
    return function(id, cb){
      firebaseRef.child(id).once('value',
          function(records){
            cb(undefined, records.val())
          },
          function(err){
            cb(err, undefined)
          }
        );
    }
  }

  var save = function(firebaseRef){
    return function(data,cb) {
      var firebase_update = {}
      firebase_update[data.id] = data
      firebaseRef.update(firebase_update, cb);
    }
  }
  
  var all = function(firebaseRef){
    return function(cb) {
      firebaseRef.once('value',
        function(records){
          cb(undefined, records.val());
        },
        function(err){
          cb(err, undefined);
        }
      );
    }
  }

  var storage = {
    teams: {
      get: get(teamsRef),
      save: save(teamsRef),
      all: all(teamsRef)
    },
    channels: {
      get: get(channelsRef),
      save: save(channelsRef),
      all: all(channelsRef)
    },
    users: {
      get: get(usersRef),
      save: save(usersRef),
      all: all(usersRef)
    }
  };

  return storage;
  
}
