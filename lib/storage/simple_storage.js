/*
Storage module for bots.

Supports storage of data on a team-by-team, user-by-user, and chnnel-by-channel basis.

save can be used to store arbitrary object.
These objects must include an id by which they can be looked up.
It is recommended to use the team/user/channel id for this purpose.
Example usage of save:
controller.storage.teams.save({id: message.team, foo:"bar"}, function(err){
  if (err)
    console.log(err)
});

get looks up an object by id.
Example usage of get:
controller.storage.teams.get(message.team, function(err, team_data){
  if (err)
    console.log(err)
  else
    console.log(team_data)
});
*/

var Store = require("jfs");

module.exports = function(config) {

  if (!config) {
    config = {
      path: "./",
    }
  }

  var teams_db = new Store(config.path + "/teams", {saveId: 'id'});
  var users_db = new Store(config.path + "/users", {saveId: 'id'});
  var channels_db = new Store(config.path + "/channels", {saveId: 'id'});
  
  var objectsToList = function(cb) {
    return function(err, data) {
      if (err) {
        cb(err, data)
      } else {
        cb(err, Object.keys(data).map(function (key) {
            return data[key];
        }));
      }
      
    };
  };

  var storage = {
    teams: {
      get: function(team_id, cb) {
        teams_db.get(team_id, cb);
      },
      save: function(team_data, cb) {
        teams_db.save(team_data.id, team_data, cb);
      },
      all: function(cb) {
        teams_db.all(objectsToList(cb));
      }
    },
    users: {
      get: function(user_id, cb) {
        users_db.get(user_id, cb);
      },
      save: function(user, cb) {
        users_db.save(user.id, user, cb);
      },
      all: function(cb) {
        users_db.all(objectsToList(cb));
      }
    },
    channels: {
      get: function(channel_id, cb) {
        channels_db.get(channel_id, cb);
      },
      save: function(channel, cb) {
        channels_db.save(channel.id, channel, cb);
      },
      all: function(cb) {
        channels_db.all(objectsToList(cb));
      }
    }
  };

  return storage;
}
