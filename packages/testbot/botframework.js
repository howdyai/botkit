// const { FacebookAdapter } = require('botbuilder-adapter-facebook');
// const { SlackAdapter, SlackMessageTypeMiddleware, SlackIdentifyBotsMiddleware, SlackEventMiddleware } = require('botbuilder-adapter-slack');
// const { WebexAdapter } = require('botbuilder-adapter-webex');
// const { HangoutsAdapter } = require('botbuilder-adapter-hangouts');
// const { TwilioAdapter } = require('botbuilder-adapter-twilio-sms');

const { BotFrameworkAdapter } = require('botbuilder');

const restify = require('restify');

// Load process.env values from .env file
require('dotenv').config();

const adapter = new BotFrameworkAdapter({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_SECRET
})

// const adapter = new FacebookAdapter({
//     verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
//     app_secret: process.env.FACEBOOK_APP_SECRET,
//     access_token: process.env.FACEBOOK_ACCESS_TOKEN
// });

// const adapter = new SlackAdapter({
//     verificationToken: process.env.verificationToken,
//     clientSigningSecret: process.env.clientSigningSecret,  
//     botToken: process.env.botToken,
// });

// const adapter = new WebexAdapter({
//     access_token: process.env.WEBEX_ACCESS_TOKEN,
//     public_address: process.env.WEBEX_PUBLIC_ADDRESS,
//     secret: 'random-secret-1234',
// })

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


const server = restify.createServer();
server.use(restify.plugins.bodyParser());

// adapter.registerWebhookSubscription('/api/messages');

server.get('/api/messages', (req, res) => {
    console.log('QUERY', req.query);

    adapter.processActivity(req, res, async(context) => {
        // do your bot logic here!


        console.log('GOT INCOMING ACTIVITY', context.activity);
        if (context.activity.type === 'message') {
            await context.sendActivity('Received an message: ' + context.activity.text);
        }

        let api = await adapter.getAPI(context.activity);
        let id = await api.callAPI('/me','GET', {});
        console.log('ID FROM API', id);
    });
});

server.listen(3000);