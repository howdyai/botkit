// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const restify = require('restify');
const path = require('path');

// Import required bot services. See https://aka.ms/bot-services to learn more about the different part of a bot
const { MemoryStorage, ConversationState, UserState, TurnContext } = require('botbuilder');
const { BotConfiguration } = require('botframework-config');

const { SlackAdapter, SlackEventMiddleware, SlackIdentifyBotsMiddleware } = require('../lib/slack_adapter');

// Read botFilePath and botFileSecret from .env file
// Note: Ensure you have a .env file and include botFilePath and botFileSecret.
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

// Create HTTP server
let server = restify.createServer();
server.use(restify.plugins.bodyParser({ mapParams: false }));
server.use(restify.plugins.queryParser());
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
});

// .bot file path
const BOT_FILE = path.join(__dirname, (process.env.botFilePath || ''));

let botConfig;
try {
    // Read bot configuration from .bot file.
    botConfig = BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);
} catch (err) {
    console.error(`\nError reading bot file. Please ensure you have valid botFilePath and botFileSecret set for your environment.`);
    console.error(`\n - The botFileSecret is available under appsettings for your Azure Bot Service bot.`);
    console.error(`\n - If you are running this bot locally, consider adding a .env file with botFilePath and botFileSecret.\n\n`);
    process.exit();
}

const DEV_ENVIRONMENT = 'development';

// bot name as defined in .bot file
// See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.
const BOT_CONFIGURATION = (process.env.NODE_ENV || DEV_ENVIRONMENT);

// Get bot endpoint configuration by service name
const endpointConfig = botConfig.findServiceByNameOrId(BOT_CONFIGURATION);

const adapter = new SlackAdapter({
    verificationToken: process.env.verificationToken,
    botToken: process.env.botToken,
    // oauthToken: process.env.oauthToken,
    // getTokenForTeam: async (teamId) => {
    //     return process.env.botToken;
    // },
    debug: true
});

// Use SlackEventMiddleware to modify incoming Activity objects so they have .type fields that match their original Slack event types.
adapter.use(new SlackEventMiddleware());

// Use SlackIdentifyBotsMiddleware to get a bot's real user id in the from field, as well as identify messages originating from THIS bot.
// Is this actual useful? Who needs self_messages?
// adapter.use(new SlackIdentifyBotsMiddleware());

// Load typing middleware
// adapter.use(new ShowTypingMiddleware(2000,4000));

// Define state store for your bot. See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a some sort of state storage system to persist the dialog and user state between messages.
const memoryStorage = new MemoryStorage();

// CAUTION: You must ensure your product environment has the NODE_ENV set
//          to use the Azure Blob storage or Azure Cosmos DB providers.
// const { BlobStorage } = require('botbuilder-azure');
// Storage configuration name or ID from .bot file
// const STORAGE_CONFIGURATION_ID = '<STORAGE-NAME-OR-ID-FROM-BOT-FILE>';
// // Default container name
// const DEFAULT_BOT_CONTAINER = '<DEFAULT-CONTAINER>';
// // Get service configuration
// const blobStorageConfig = botConfig.findServiceByNameOrId(STORAGE_CONFIGURATION_ID);
// const blobStorage = new BlobStorage({
//     containerName: (blobStorageConfig.container || DEFAULT_BOT_CONTAINER),
//     storageAccountOrConnectionString: blobStorageConfig.connectionString,
// });

// Create conversation state with in-memory storage provider.
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        if (context.activity.type === 'message') {
            if (context.activity.text === 'delayed') {
                await context.sendActivity('give me 10 seconds....');
                await respondDelayed(context);
            } else if (context.activity.text === 'delete') {
                const outgoing = await context.sendActivity('This message will self destruct in a few seconds!');
                // console.log('outgoing id:', outgoing);
                var reference = TurnContext.getConversationReference(context.activity);
                setTimeout(async () => {
                    await adapter.continueConversation(reference, async function(new_context) {
                        adapter.deleteActivity(new_context, outgoing);
                    });
                }, 5000);
            } else if (context.activity.text === 'update') {
                const outgoing = await context.sendActivity('This message will be updated in a few seconds!');
                // console.log('outgoing id:', outgoing);
                var reference = TurnContext.getConversationReference(context.activity);
                setTimeout(async () => {
                    await adapter.continueConversation(reference, async function(new_context) {
                        var update = {
                            text: 'This has been updated',
                            ...outgoing
                        }
                        const activity = TurnContext.applyConversationReference(update, reference);
                        adapter.updateActivity(new_context, activity);
                    });
                }, 5000);
            } else {
                await context.sendActivity({
                    text: 'Heard: ' + context.activity.text,
                    channelData: {
                        attachments: [
                            {
                                title: 'Options',
                                callback_id: '123',
                                actions: [
                                    {
                                        name: 'ok_button',
                                        text: 'OK',
                                        value: true,
                                        type: 'button'
                                    }
                                ]
                            }
                        ]
                    }
                });
            }
        } else {
            // console.log('EVENT:', context.activity.type);
            if (context.activity.type === 'interactive_message') {
                const slack = await adapter.getAPI(context.activity);
                slack.dialog.open({
                    trigger_id: context.activity.channelData.trigger_id,
                    dialog: {
                        'callback_id': 'ryde-46e2b0',
                        'title': 'Request a Ride',
                        'submit_label': 'Request',
                        'notify_on_cancel': true,
                        'state': 'Limo',
                        'elements': [
                            {
                                'type': 'text',
                                'label': 'Pickup Location',
                                'name': 'loc_origin'
                            },
                            {
                                'type': 'text',
                                'label': 'Dropoff Location',
                                'name': 'loc_destination'
                            }
                        ]
                    }
                });
            } else if (context.activity.type === 'dialog_submission') {
                console.log('DIALOG SUBMISSION:', context.activity.channelData.submission);
            } else if (context.activity.type === 'self_bot_message') {
                console.log('I CAN HEAR MYSELF TALKING!!!');
            }
        }
    });
});

// Catch-all for errors.
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    console.error(`\n [onTurnError]: ${ error }`);
    // Send a message to the user
    context.sendActivity(`Oops. Something went wrong!`);
    // Clear out state
    conversationState.clear(context);
};

async function respondDelayed(context) {
    var reference = TurnContext.getConversationReference(context.activity);
    // console.log('GOT A REFERENCE', reference);
    setTimeout(async function() {
        // console.log('FIRING DELAYED CONTINUE');
        await adapter.continueConversation(reference, async function(new_context) {
            // console.log('GOT A NEW CONTEXT');
            await new_context.sendActivity('I waited 10 seconds to tell you this.');
        });
    }, 10000);
}
