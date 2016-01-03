/*
Firebase storage module for bots.

Note that this storage module does not specify how to authenticate to Firebase.
There are many methods of user authentication for Firebase.
Please read: https://www.firebase.com/docs/web/guide/user-auth.html

Supports storage of data on a team-by-team, user-by-user, and chnnel-by-channel basis.

save can be used to store arbitrary object.
These objects must include an id by which they can be looked up.
It is recommended to use the team/user/channel id for this purpose.
Example usage of save:
controller.storage.teams.save({id: message.team, foo:"bar"}, function(err){
  if (err)
    console.log(err)`
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

var Firebase = require('firebase');

module.exports = function(config) {

    if (!config && !config.firebase_uri)
        throw new Error('Need to provide firebase address. This should look something like ' +
            '"https://botkit-example.firebaseio.com/"');

    var rootRef = new Firebase(config.firebase_uri);
    var teamsRef = rootRef.child('teams');
    var usersRef = rootRef.child('users');
    var channelsRef = rootRef.child('channels');

    var get = function(firebaseRef) {
        return function(id, cb) {
            firebaseRef.child(id).once('value',
                function(records) {
                    cb(undefined, records.val());
                },
                function(err) {
                    cb(err, undefined);
                }
            );
        };
    };

    var save = function(firebaseRef) {
        return function(data, cb) {
            var firebase_update = {};
            firebase_update[data.id] = data;
            firebaseRef.update(firebase_update, cb);
        };
    };

    var all = function(firebaseRef) {
        return function(cb) {
            firebaseRef.once('value',
                function(records) {
                    var list = [];
                    for (key of Object.keys(records.val())) {
                        list.push(records.val()[key]);
                    }
                    cb(undefined, list);
                },
                function(err) {
                    cb(err, undefined);
                }
            );
        };
    };

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

};
