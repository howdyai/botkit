var db = require('monk');

module.exports = function(config) {

  if (!config && !config.mongo_uri) throw new Error('Need to provide mongo address.');

  var teams_db = db(config.mongo_uri).get('teams');
  var users_db = db(config.mongo_uri).get('users');
  var channels_db = db(config.mongo_uri).get('channels');

  var storage = {
    teams: {
      get: function(team_id,cb) {
        teams_db.find({id: team_id}, cb);
      },
      save: function(team,cb) {
        teams_db.findAndModify({id: team.id},team,{upsert: true, new: true}, cb);
      },
      all: function(cb) {
        teams_db.find({}, cb);
      }
    },
    users: {
      get: function(user_id,cb) {
        users_db.find({id: user_id}, cb);
      },
      save: function(user,cb) {
        users_db.findAndModify({id: user.id}, user, {upsert: true, new: true}, cb);
      },
      all: function(cb) {
        users_db.find({}, cb);
      }
    },
    channels: {
      get: function(channel_id, cb) {
        channels_db.find({id: channel_id}, cb);
      },
      save: function(channel, cb) {
        channels_db.findAndModify({id: channel.id}, channel, {upsert: true, new: true}, cb);
      },
      all: function(cb) {
        channels_db.find({}, cb);
      }
    }
  };

  return storage;
};
