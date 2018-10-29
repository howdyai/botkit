var WebexBot = require(__dirname + '/WebexBot.js');
var jwt = require('jsonwebtoken');
var request = require('request-promise');

module.exports = {
    init: async function (configuration) {
        var oauth = await genToken(configuration);
        configuration.access_token = oauth.token;
        configuration.access_refresh = oauth.expiresIn;
        return(WebexBot(configuration));
    },

    refresh: async function (controller){
        var oauth = await genToken(controller.config);
        controller.api = require('ciscospark').init({
            credentials: {
                authorization: {
                    access_token: oauth.token
                }
            }
        });
        controller.config.access_token = oauth.token;
        controller.config.access_refresh = oauth.expiresIn;
        return(controller);
    }

}

async function genToken(configuration) {
    var expiration = configuration.guest_id || '1h';
    var jwtoken = jwt.sign(
        {
            "sub": configuration.guest_id,
            "name": configuration.guest_name,
            "iss": configuration.guest_issuer_id
        },
    Buffer.from(configuration.guest_issuer_secret, 'base64'),
    { expiresIn: expiration }
    );
    var response = await request.post({
            url : 'https://api.ciscospark.com/v1/jwt/login',
            auth: {
            'bearer': jwtoken
            }
        });
    return JSON.parse(response);
}


