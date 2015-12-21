var redis = require('redis');

/*
 * All optionnals
 *
 * config = {
 *  namespace: namespace,
 *  host: host,
 *  port: port
 * }
 */
module.exports = function(config) {
  config = config || {};
  config.namespace = config.namespace || 'botkit:store';

  var storage = {},
    client = redis.createClient(config), // could pass specific redis config here
    methods = config.methods || ['teams', 'users', 'channels'];

  // Implements required API methods
  for (var i = 0; i < methods.length; i++) {
    storage[methods[i]] = function(hash) {
      return {
        get: function(id,cb) {
          client.hget(config.namespace + ':' + hash, id, function (err, res) {
            cb(err, JSON.parse(res));
          });
        },
        save: function(object,cb) {
          if (!object.id) // Silently catch this error?
            return cb(new Error('The given object must have an id property'), {});

          client.hset(config.namespace + ':' + hash, object.id, JSON.stringify(object), cb);
        },
        all: function(cb) {
          client.hgetall(config.namespace + ':' + hash, function (err, res) {
            if (err)
              return cb(err, {});

            if (null === res)
              return cb(err, res);

            for (var i in res)
              res[i] = JSON.parse(res[i]);

            cb(err, res);
          });
        }
      }
    }(methods[i]);
  }

  return storage;
};
