const { Botkit } = require('botkit');
const { SlackAdapter, SlackMessageTypeMiddleware, SlackIdentifyBotsMiddleware, SlackEventMiddleware } = require('botbuilder-slack');
const { WebexAdapter } = require('botbuilder-webex');
const { ShowTypingMiddleware } = require('botbuilder');
const { WebsocketAdapter } = require('botbuilder-websocket');

const basicAuth = require('express-basic-auth');


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
});

// Use SlackEventMiddleware to emit events that match their original Slack event types.
// this may BREAK waterfall dailogs which only accept ActivityTypes.Message
adapter.use(new SlackEventMiddleware());

// Use SlackMessageType middleware to further classify messages as direct_message, direct_mention, or mention
adapter.use(new SlackMessageTypeMiddleware());

adapter.use(new SlackIdentifyBotsMiddleware());

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
    }
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

});

