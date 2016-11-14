var _ = require('lodash');

/**
 * Checks that a list of methods are present on an object, throwing an error if they are not.
 *
 * @param {string} name    the object name, used in the error message
 * @param {object} object  the object to test
 * @param {object} methods a collection of names to test for
 */
function ensureMethodsArePresent(name, object, methods) {
    var missing = _.filter(methods, function(m) {
        return _.isFunction(_.get(object, m) !== 'function');
    });
    if (!_.isEmpty(missing)) {
        throw new Error(name + ' does not have all required methods: ' + _.join(missing, ', '));
    }
}

module.exports = {
    ensureMethodsArePresent: ensureMethodsArePresent
};
