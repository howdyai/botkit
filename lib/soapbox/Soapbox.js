var CreateTeam = require('./events/CreateTeam.js');

var Soapbox = function(controller) {
    var controller = controller;

    this.createTeam = new CreateTeam(this);

    this.loadFromCache = function(userId, callback)
    {
        controller.storage.users.get(userId, function(err, userData) {
            if (err) {
                callback(false);
            }

            callback(userData);
        });
    }

    this.saveUser = function(data)
    {
        controller.storage.users.save(data.user, function(err) {
            if (err) {
                console.log('**Failed to write to cache');
            }
        });
    }
}

module.exports = Soapbox;
