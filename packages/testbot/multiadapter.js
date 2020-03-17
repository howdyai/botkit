/**
 * This is a sample implementation of a multi-adapter bot
 * This demonstrates using the built-in Bot Framework adapter along side the Botkti webchat AND Facebook adapters.
 */

const { Botkit } = require('botkit');

const { WebAdapter } = require('botbuilder-adapter-web');
const { FacebookAdapter, FacebookEventTypeMiddleware } = require('botbuilder-adapter-facebook');

// Load process.env values from .env file
require('dotenv').config();


// set up Web Adapter
const web_adapter = new WebAdapter({});

// Set up Facebook Adapter
const facebook_adapter = new FacebookAdapter({
    enable_incomplete: true,
    verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
    access_token: process.env.FACEBOOK_ACCESS_TOKEN,
    app_secret: process.env.FACEBOOK_APP_SECRET,
    app_id: process.env.FACEBOOK_APP_ID,
})

// emit events based on the type of facebook event being received
facebook_adapter.use(new FacebookEventTypeMiddleware());


// boot controller with the built-in bot framework adapter that works with emulator and Azure bot service
// you could also pass in one of the above adapters as the "default" adapter and bind secondary as below...
const controller = new Botkit({
    debug: true,
    webhook_uri: '/api/messages',
    webserver_middlewares: [(req, res, next) => { console.log('REQ > ', req.url); next(); }],
});

controller.ready(() => {

    // Make the web chat work 
    // make the web chat available at http://localhost:3000
    controller.publicFolder('/',__dirname  + '/public');
    // bind websocket to the webserver
    web_adapter.createSocketServer(controller.http, {}, controller.handleTurn.bind(controller));


    // Make the Facebook adapter work
    // we do this by creating a SECOND webhook endpoint
    // and calling the facebook_adapter directly as below.
    // this is what Botkit does internally, see:
    // https://github.com/howdyai/botkit/blob/master/packages/botkit/src/core.ts#L675
    controller.webserver.post('/api/facebook', (req, res) => {
        facebook_adapter.processActivity(req, res, controller.handleTurn.bind(controller)).catch((err) => {
            console.error('Experienced an error inside the turn handler', err);
            throw err;
        });
    });

    controller.on('message', async (bot, message) => {
        const adapter_type = bot.getConfig('context').adapter.name;
        await bot.reply(message,`I heard ya on my ${ adapter_type }  adapter`);
    });

});