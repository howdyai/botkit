const { FacebookAdapter } = require('botbuilder-adapter-facebook');
const restify = require('restify');

// Load process.env values from .env file
require('dotenv').config();

const adapter = new FacebookAdapter({
    verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
    app_secret: process.env.FACEBOOK_APP_SECRET,
    access_token: process.env.FACEBOOK_ACCESS_TOKEN
});
const server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async(context) => {
        // do your bot logic here!
        console.log('GOT INCOMING ACTIVITY', context.activity);
        if (context.activity.type === 'message') {
            await context.sendActivity('Received an message: ' + context.activity.text);
        }
    });
});

server.listen(3000);