var redis = require('redis'); //https://github.com/NodeRedis/node_redis

/*
 * All optional
 *
 * config = {
 *  namespace: namespace,
 *  host: host,
 *  port: port
 * }
 * // see
 * https://github.com/NodeRedis/node_redis
 * #options-is-an-object-with-the-following-possible-properties for a full list of the valid options
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
                get: function(id, cb) {
                    client.hget(config.namespace + ':' + hash, id, function(err, res) {
                        cb(err, JSON.parse(res));
                    });
                },
                save: function(object, cb) {
                    if (!object.id) // Silently catch this error?
                        return cb(new Error('The given object must have an id property'), {});
                    client.hset(config.namespace + ':' + hash, object.id, JSON.stringify(object), cb);
                },
                all: function(cb, options) {
                    client.hgetall(config.namespace + ':' + hash, function(err, res) {
                        if (err)
                        return cb(err, {});

                        if (null === res)
                        return cb(err, res);

                        var parsed;
                        var array = [];

                        for (var i in res) {
                            parsed = JSON.parse(res[i]);
                            res[i] = parsed;
                            array.push(parsed);
                        }

                        cb(err, options && options.type === 'object' ? res : array);
                    });
                },
                allById: function(cb) {
                    this.all(cb, {type: 'object'});
                }
            };
        }(methods[i]);
    }
    return storage;
};
