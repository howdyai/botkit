/**
 * Authentication module composed of an Express middleware used to validate
 * incoming requests from the Slack API for Slash commands and outgoing
 * webhooks.
 */

// the list of authorized tokens that can invoke slash comamnds
var authenticationTokens = [];
const TOKEN_NOT_FOUND = -1;

function init(tokens) {
    authenticationTokens = authenticationTokens.concat(tokens);
    return authenticate;
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

    next();
}

module.exports = init;
