/**
 * Authentication module composed of an Express middleware used to validate
 * incoming requests from the Slack API for Slash commands and outgoing
 * webhooks.
 */

// Comparison constant
var TOKEN_NOT_FOUND = -1;

function init(tokens) {
    var authenticationTokens = flatten(tokens);

    if (authenticationTokens.length === 0) {
        console.warn('No auth tokens provided, webhook endpoints will always reply HTTP 401.');
    }

    /**
     * Express middleware that verifies a Slack token is passed;
     * if the expected token value is not passed, end with request test
     * with a 401 HTTP status code.
     *
     * Note: Slack is totally wacky in that the auth token is sent in the body
     * of the request instead of a header value.
     *
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @param {function} next - Express callback
     */
    function authenticate(req, res, next) {
        if (!req.body || !req.body.token || authenticationTokens.indexOf(req.body.token) === TOKEN_NOT_FOUND) {
            res.status(401).send({
                'code': 401,
                'message': 'Unauthorized'
            });

            return;
        }

        slack_botkit.log(
            '** Requiring token authentication for webhook endpoints for Slash commands ' +
            'and outgoing webhooks; configured ' + tokens.length + ' tokens'
        );
        next();
    }

    return authenticate;
}
/**
 * Function that flattens a series of arguments into an array.
 *
 * @param {Array} args - No token (null), single token (string), or token array (array)
 * @returns {Array} - Every element of the array is an authentication token
 */
function flatten(args) {
        var result = [];

        // convert a variable argument list to an array
        args.forEach(function(arg) {
            result = result.concat(arg);
        });
        return result;
    }
module.exports = init;
