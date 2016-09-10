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

var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();

module.exports = function (config) {
    if (!config) {
        config = {
            path: './',
        };
    }

    var db;

    var _connectDb = function () {
        var dbPath = path.resolve(config.path, 'bot.db');

        if (!fs.existsSync(dbPath)) {
            //create dir if missing
            var dbDir = path.resolve(config.path);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir);
            }

            //create db file
            fs.openSync(dbPath, 'w');
        }

        db = new SQLite.Database(dbPath, _firstRunCheck);
    };

    var _firstRunCheck = function () {
        db.run("CREATE TABLE IF NOT EXISTS teams (id TEXT PRIMARY KEY NOT NULL, data TEXT)");
        db.run("CREATE TABLE IF NOT EXISTS channels (id TEXT PRIMARY KEY NOT NULL, data TEXT)");
        db.run("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY NOT NULL, data TEXT)");
    };

    _connectDb();

    var storage = {
        base: {
            get: function (table, id, cb) {
                db.get("SELECT data FROM " + table + " WHERE id=?", [id], function (err, item) {
                    var data;

                    if (!err && item) {
                        data = JSON.parse(item.data);
                    }

                    cb(err, data);
                });
            },
            save: function (table, data, cb) {
                db.run("INSERT OR REPLACE INTO " + table + " (id, data) VALUES (?, ?)", [data.id, JSON.stringify(data)], cb);
            },
            delete: function (table, id, cb) {
                db.run("DELETE FROM " + table + " WHERE id=?", [id], cb);
            },
            all: function (table, cb) {
                db.all("SELECT data FROM " + table, [], function (err, rows) {
                    var data = [];

                    if (!err && rows) {
                        rows.forEach(function (item) {
                            data.push(JSON.parse(item.data));
                        }, this);
                    }

                    cb(err, data);
                });
            }
        },
        teams: {
            get: function (id, cb) {
                storage.base.get("teams", id, cb);
            },
            save: function (data, cb) {
                storage.base.save("teams", data, cb);
            },
            delete: function (table, id, cb) {
                storage.base.delete("teams", id, cb);
            },
            all: function (cb) {
                storage.base.all("teams", cb);
            }
        },
        users: {
            get: function (id, cb) {
                storage.base.get("users", id, cb);
            },
            save: function (data, cb) {
                storage.base.save("users", data, cb);
            },
            delete: function (table, id, cb) {
                storage.base.delete("users", id, cb);
            },
            all: function (cb) {
                storage.base.all("users", cb);
            }
        },
        channels: {
            get: function (id, cb) {
                storage.base.get("channels", id, cb);
            },
            save: function (data, cb) {
                storage.base.save("channels", data, cb);
            },
            delete: function (table, id, cb) {
                storage.base.delete("channels", id, cb);
            },
            all: function (cb) {
                storage.base.all("channels", cb);
            }
        }
    };

    return storage;
};