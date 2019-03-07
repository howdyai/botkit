const { Botkit } = require('botkit');
const { SlackAdapter, SlackMessageTypeMiddleware, SlackIdentifyBotsMiddleware, SlackEventMiddleware } = require('botbuilder-slack');
const { WebexAdapter } = require('botbuilder-webex');
const { ShowTypingMiddleware } = require('botbuilder');
const { WebsocketAdapter } = require('botbuilder-websocket');
const { MongoDbStorage } = require('botbuilder-storage-mongodb');

const basicAuth = require('express-basic-auth');

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
const adapter = new SlackAdapter({
    verificationToken: process.env.verificationToken,
    botToken: process.env.botToken,
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['bot'],
    redirectUri: process.env.redirectUri,
    getTokenForTeam: getTokenForTeam,
    getBotUserByTeam: getBotUserByTeam,
});

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
// this may BREAK waterfall dailogs which only accept ActivityTypes.Message
adapter.use(new SlackEventMiddleware());

// Use SlackMessageType middleware to further classify messages as direct_message, direct_mention, or mention
adapter.use(new SlackMessageTypeMiddleware());

// adapter.use(new SlackIdentifyBotsMiddleware());

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

const controller = new Botkit({
    debug: true,
    webhook_uri: '/api/messages',
    adapter: adapter,
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

// show typing indicator while bot "thinks"
// controller.adapter.use(new ShowTypingMiddleware());

// controller.adapter.use(async(context, next) => {
//     // console.log('---START TURN---');

//     // set a delay between each message sent.
//     context.onSendActivities(async (ctx, activities, inside_next) => {
//         return new Promise((resolve) => {
//             setTimeout(() => {
//                 inside_next().then(resolve); 
//             },1500);
//         });
//     });

//     await next();
//     // console.log('---END TURN---');
// })


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
        // controller.middleware.receive.use(async (bot, message, next) => {
            let results = false;
            // if (message.type === 'message') {
                results = await controller.cms.testTrigger(bot, message);
            // }

            if (results !== false) {
                return false;
                // do not continue middleware!
            }
            if (next) { next(); }
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

