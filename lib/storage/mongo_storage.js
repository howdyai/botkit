var db = require('monk'); //https://www.npmjs.com/package/monk

module.exports = function(config) {

  if (!config && !config.mongo_uri) throw new Error('Need to provide mongo address.');
  /* Your mongo_uri will look something like
  'mongodb://test:test@ds037145.mongolab.com:37145/slack-bot-test'
  or 'localhost/mydb,192.168.1.1' */

  var teams_db = db(config.mongo_uri).get('teams');
  var users_db = db(config.mongo_uri).get('users');
  var channels_db = db(config.mongo_uri).get('channels');

  var unwrapFromList = function(cb) {
    return function(err, data) {
      if (err) {
        cb(err, data);
      } else {
        cb(err, data[0]);
      }
    };
  };
  
  var storage = {
    teams: {
      get: function(team_id, cb) {
        teams_db.find({id: team_id}, unwrapFromList(cb));
      },
      save: function(team_data, cb) {
        teams_db.findAndModify({id: team_data.id}, team_data, {upsert: true, new: true}, cb);
      },
      all: function(cb) {
        teams_db.find({}, cb);
      }
    },
    users: {
      get: function(user_id, cb) {
        users_db.find({id: user_id}, unwrapFromList(cb));
      },
      save: function(user_data, cb) {
        users_db.findAndModify({id: user_data.id}, user_data, {upsert: true, new: true}, cb);
      },
      all: function(cb) {
        users_db.find({}, cb);
      }
    },
    channels: {
      get: function(channel_id, cb) {
        channels_db.find({id: channel_id}, unwrapFromList(cb));
      },
      save: function(channel_data, cb) {
        channels_db.findAndModify({id: channel_data.id}, channel_data, {upsert: true, new: true}, cb);
      },
      all: function(cb) {
        channels_db.find({}, cb);
      }
    }
  };

  return storage;
};
