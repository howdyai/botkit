var Store = require("jfs");

module.exports = function(config) {

  if (!config) {
    config = {
      path: "./",
    }
  }

  var teams_db = new Store(config.path + "/teams",{saveId: 'id'});
  var users_db = new Store(config.path + "/users",{saveId: 'id'});
  var channels_db = new Store(config.path + "/channels",{saveId: 'id'});


  var storage = {
    teams: {
      get: function(team_id,cb) {
        teams_db.get(team_id,cb);
      },
      save: function(team,cb) {
        teams_db.save(team.id,team,cb);
      },
      all: function(cb) {
        teams_db.all(cb)
      }
    },
    users: {
      get: function(user_id,cb) {
        users_db.get(user_id,cb);
      },
      save: function(user,cb) {
        users_db.save(user.id,user,cb);
      },
      all: function(cb) {
        users_db.all(cb)
      }
    },
    channels: {
      get: function(channel_id,cb) {
        channels_db.get(channel_id,cb);
      },
      save: function(channel,cb) {
        channels_db.save(channel.id,channel,cb);
      },
      all: function(cb) {
        channels_db.all(cb)
      }
    }
  };

  return storage;

}
