/*

This file demonstrates how to use your own instance of Express
along with Botkit and one or more adapters.

This is also a good starting point for using multiple adapters.
*/
const { Botkit } = require('botkit');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');

// Configure an Express app
const app = express();

// Configure Botkit WITHOUT a webserver.
// disable_webserver turns off the internal Express.
// This means we need to configure our own webhook endpoint.
// In this instance, we are configuring a Bot Framework adapter.
const controller = new Botkit({
    disable_webserver: true,
    adapterConfig: {
        appId: process.env.APP_ID,
        appPassword: process.env.APP_PASSWORD,
    }
});


// some options for express
// this setup is identical to the way Botkit configures itself
const _config =
    {
        jsonLimit: '100kb',
        urlEncodedLimit: '100kb',
        webhook_uri: '/api/messages',
    };

// capture raw body in addition to the parsed content
app.use((req, res, next) => {
    req.rawBody = '';
    req.on('data', function(chunk) {
        req.rawBody += chunk;
    });
    next();
});

app.use(bodyParser.json({ limit: _config.jsonLimit }));
app.use(bodyParser.urlencoded({ limit: _config.urlEncodedLimit, extended: true }));

app.post(_config.webhook_uri, (req, res) => {
    // Allow the Botbuilder middleware to fire.
    // this middleware is responsible for turning the incoming payload into a BotBuilder Activity
    // which we can then use to turn into a BotkitMessage
    controller.adapter.processActivity(req, res, controller.handleTurn.bind(controller)).catch((err) => {
        console.error('Experienced an error inside the turn handler', err);
        throw err;
    });
});

// Define your bot handlers...
controller.on('message', async(bot, message) => {
    await bot.reply(message, 'Received.');
})


// fire up the webserver...
const server = http.createServer(app);
server.listen(process.env.port || process.env.PORT || 3000, () => {
    console.log(`Webhook endpoint online:  http://localhost:${ process.env.PORT || 3000 }${ _config.webhook_uri }`);
});
