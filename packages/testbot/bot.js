const { Botkit } = require('botkit');
const { ShowTypingMiddleware } = require('botbuilder');
const { MongoDbStorage } = require('botbuilder-storage-mongodb');
const basicAuth = require('express-basic-auth');

// const { SlackAdapter, SlackMessageTypeMiddleware, SlackIdentifyBotsMiddleware, SlackEventMiddleware } = require('botbuilder-adapter-slack');
// const { WebexAdapter } = require('botbuilder-adapter-webex');
// const { WebsocketAdapter } = require('botbuilder-adapter-websocket');
// const { FacebookAdapter, FacebookEventTypeMiddleware } = require('botbuilder-adapter-facebook');
// const { HangoutsAdapter } = require('botbuilder-adapter-hangouts');
// const { TwilioAdapter } = require('botbuilder-adapter-twilio-sms');


// Load process.env values from .env file
require('dotenv').config();

let storage = null;
if (process.env.MONGO_URI) {
    storage = mongoStorage = new MongoDbStorage({
        url : process.env.MONGO_URI,
        // database: "botframework",
        // collection: "botframework"
    });
}

/* ----------------------------------------------------------------------
 * .-.   .-.      .-.
 * : :.-.: :      : :
 * : :: :: : .--. : `-.  .--. .-.,-.
 * : `' `' ;' '_.'' .; :' '_.'`.  .'
 *  `.,`.,' `.__.'`.__.'`.__.':_,._;
 * Configure the Webex Teams adapter
 * ----------------------------------------------------------------------
 */
// const adapter = new WebexAdapter({
//     access_token: process.env.access_token,
//     public_address: process.env.public_address
// })

/* ----------------------------------------------------------------------
 *  .--. .-.               .-.
 * : .--': :               : :.-.
 * `. `. : :   .--.   .--. : `'.'
 * _`, :: :_ ' .; ; '  ..': . `.
 * `.__.'`.__;`.__,_;`.__.':_;:_;
 * Configure the Slack adapter
 * ----------------------------------------------------------------------
 */
// const adapter = new SlackAdapter({
//    verificationToken: process.env.verificationToken,
//     clientSigningSecret: process.env.clientSigningSecret,  
//     botToken: process.env.botToken,
//     clientId: process.env.clientId,
//     clientSecret: process.env.clientSecret,
//     scopes: ['bot'],
//     redirectUri: process.env.redirectUri,
//     getTokenForTeam: getTokenForTeam,
//     getBotUserByTeam: getBotUserByTeam,
// });

let tokenCache = {};
let userCache = {};

if (process.env.TOKENS) {
    tokenCache = JSON.parse(process.env.TOKENS);
} 

if (process.env.USERS) {
    userCache = JSON.parse(process.env.USERS);
} 

async function getTokenForTeam(teamId) {
    if (tokenCache[teamId]) {
        return new Promise((resolve) => {
            setTimeout(function() {
                resolve(tokenCache[teamId]);
            }, 150);
        });
    } else {
        console.error('Team not found in tokenCache: ', teamId);
    }
}

async function getBotUserByTeam(teamId) {
    if (userCache[teamId]) {
        return new Promise((resolve) => {
            setTimeout(function() {
                resolve(userCache[teamId]);
            }, 150);
        });
    } else {
        console.error('Team not found in userCache: ', teamId);
    }
}


// Use SlackEventMiddleware to emit events that match their original Slack event types.
// adapter.use(new SlackEventMiddleware());

// Use SlackMessageType middleware to further classify messages as direct_message, direct_mention, or mention
// adapter.use(new SlackMessageTypeMiddleware());

/* ----------------------------------------------------------------------
 *  __      __      ___.                        __           __   
 * /  \    /  \ ____\_ |__   __________   ____ |  | __ _____/  |_ 
 * \   \/\/   // __ \| __ \ /  ___/  _ \_/ ___\|  |/ // __ \   __\
 *  \        /\  ___/| \_\ \\___ (  <_> )  \___|    <\  ___/|  |  
 *   \__/\  /  \___  >___  /____  >____/ \___  >__|_ \\___  >__|  
 *        \/       \/    \/     \/           \/     \/    \/     
 * Configure the Websocket adapter
 * ----------------------------------------------------------------------
 */
// const adapter = new WebsocketAdapter({});

// const adapter = new FacebookAdapter({
//     verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
//     access_token: process.env.FACEBOOK_ACCESS_TOKEN,
//     app_secret: process.env.FACEBOOK_APP_SECRET,
// })

// // emit events based on the type of facebook event being received
// adapter.use(new FacebookEventTypeMiddleware());


// const adapter = new HangoutsAdapter({
//     token: process.env.GOOGLE_TOKEN,
//     google_auth_params: {
//         credentials: JSON.parse(process.env['GOOGLE_CREDS'])
//     }
// });

// const adapter = new TwilioAdapter({
//     twilio_number: process.env.TWILIO_NUMBER,
//     account_sid: process.env.TWILIO_ACCOUNT_SID,
//     auth_token: process.env.TWILIO_AUTH_TOKEN,
// });

const controller = new Botkit({
    debug: true,
    webhook_uri: '/api/messages',
    // adapter: adapter,
    authFunction:  basicAuth({
        users: { 'admin': 'supersecret' }, // TODO: externalize these
        challenge: true,
    }),
    cms: {
        cms_uri: process.env.cms_uri,
        token: process.env.cms_token,
    },
    storage
});

// Once the bot has booted up its internal services, you can use them to do stuff.
controller.ready(() => {

    // load traditional developer-created local custom feature modules
    controller.loadModules(__dirname + '/features');

    // load "packaged" plugins
    // turn on verbose console logging of send/receive/web requests
    controller.plugins.use(require('./plugins/verbose/index.js'));

    // turn on /admin route
    controller.plugins.use(require('./plugins/admin/index.js'));

    // turn on the /sample route
    controller.plugins.use(require('./plugins/sample/sample.js'));

    /* catch-all that uses the CMS to trigger dialogs */
    if (controller.cms) {
        controller.on('message,direct_message', async (bot, message) => {
            let results = false;
            results = await controller.cms.testTrigger(bot, message);

            if (results !== false) {
                // do not continue middleware!
                return false;
            }
        });
    }

    controller.webserver.get('/install', (req, res) => {
        // getInstallLink points to slack's oauth endpoint and includes clientId and scopes
        res.redirect(controller.adapter.getInstallLink());
    });

    controller.webserver.get('/install/auth', async (req, res) => {
        try {
            const results = await controller.adapter.validateOauthCode(req.query.code);

            console.log('FULL OAUTH DETAILS', results);

            // Store token by team in bot state.
            tokenCache[results.team_id] = results.bot.bot_access_token;

            // Capture team to bot id
            // TODO: this will have to be customized
            userCache[results.team_id] =  results.bot.bot_user_id;

            res.json('Success! Bot installed.');

        } catch (err) {
            console.error('OAUTH ERROR:', err);
            res.status(401);
            res.send(err.message);
        }
    });
});

