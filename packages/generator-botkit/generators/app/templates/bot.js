//  __   __  ___        ___
// |__) /  \  |  |__/ |  |  
// |__) \__/  |  |  \ |  |  

// This is the main file for the <%= name %> bot.

// Import Botkit's core features
const { Botkit } = require('botkit');

// Import a platform-specific adapter for <%= platform %>.
<% if (platform === 'slack') { %>
const { SlackAdapter, SlackMessageTypeMiddleware, SlackEventMiddleware } = require('botbuilder-slack');
<% } else if (platform === 'webex') { %>
const { WebexAdapter } = require('botbuilder-webex');
<% } else if (platform === 'websocket') { %>
const { WebsocketAdapter } = require('botbuilder-websocket');
<% } else if (platform === 'facebook') { %>
const { FacebookAdapter, FacebookEventTypeMiddleware } = require('botbuilder-facebook');
<% } else if (platform === 'twilio-sms') { %>const { TwilioAdapter } = require('botbuilder-twilio-sms');
<% } else if (platform === 'hangouts') { %>const { HangoutsAdapter } = require('botbuilder-hangouts');<% } %>
const { MongoDbStorage } = require('botbuilder-storage-mongodb');

// Load process.env values from .env file
require('dotenv').config();

let storage = null;
if (process.env.MONGO_URI) {
    storage = mongoStorage = new MongoDbStorage({
        url : process.env.MONGO_URI,
    });
}