/**
 * @module botbuilder-adapter-slack
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity, ActivityTypes, BotAdapter, TurnContext, ConversationReference, ResourceResponse } from 'botbuilder';
import { WebClient, WebAPICallResult } from '@slack/web-api';
import { SlackBotWorker } from './botworker';
import * as crypto from 'crypto';
import * as Debug from 'debug';
const debug = Debug('botkit:slack');

/**
 * Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Slack.
 */
export class SlackAdapter extends BotAdapter {
    private options: SlackAdapterOptions;
    private slack: WebClient;
    private identity: {
        user_id: string;
    };

    /**
     * Name used by Botkit plugin loader
     * @ignore
     */
    public name = 'Slack Adapter';

    /**
     * Object containing one or more Botkit middlewares to bind automatically.
     * @ignore
     */
    public middlewares;

    /**
     * A customized BotWorker object that exposes additional utility methods.
     * @ignore
     */
    public botkit_worker = SlackBotWorker;

    /**
     * Create a Slack adapter.
     *
     * The SlackAdapter can be used in 2 modes:
     *      * As an "[internal integration](https://api.slack.com/internal-integrations) connected to a single Slack workspace
     *      * As a "[Slack app](https://api.slack.com/slack-apps) that uses oauth to connect to multiple workspaces and can be submitted to the Slack app.
     *
     * [Read here for more information about all the ways to configure the SlackAdapter &rarr;](../../botbuilder-adapter-slack/readme.md).
     *
     * Use with Botkit:
     *```javascript
     * const adapter = new SlackAdapter({
     *      clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
     *      botToken: process.env.BOT_TOKEN
     * });
     * const controller = new Botkit({
     *      adapter: adapter,
     *      // ... other configuration options
     * });
     * ```
     *
     * Use with BotBuilder:
     *```javascript
     * const adapter = new SlackAdapter({
     *      clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
     *      botToken: process.env.BOT_TOKEN
     * });
     * // set up restify...
     * const server = restify.createServer();
     * server.use(restify.plugins.bodyParser());
     * server.post('/api/messages', (req, res) => {
     *      adapter.processActivity(req, res, async(context) => {
     *          // do your bot logic here!
     *      });
     * });
     * ```
     *
     * Use in "Slack app" multi-team mode:
     * ```javascript
     * const adapter = new SlackAdapter({
     *     clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
     *     clientId: process.env.CLIENT_ID, // oauth client id
     *     clientSecret: process.env.CLIENT_SECRET, // oauth client secret
     *     scopes: ['bot'], // oauth scopes requested
     *     oauthVersion: 'v1',
     *     redirectUri: process.env.REDIRECT_URI, // url to redirect post login defaults to `https://<mydomain>/install/auth`
     *     getTokenForTeam: async(team_id) => Promise<string>, // function that returns a token based on team id
     *     getBotUserByTeam: async(team_id) => Promise<string>, // function that returns a bot's user id based on team id
     * });
     * ```
     *
     * @param options An object containing API credentials, a webhook verification token and other options
     */
    public constructor(options: SlackAdapterOptions) {
        super();

        this.options = options;

        /*
        * Check for security options. If these are not set, malicious actors can
        * spoof messages from Slack.
        * These will be required in upcoming versions of Botkit.
        */
        if (!this.options.verificationToken && !this.options.clientSigningSecret) {
            const warning = [
                '',
                '****************************************************************************************',
                '* WARNING: Your bot is operating without recommended security mechanisms in place.     *',
                '* Initialize your adapter with a clientSigningSecret parameter to enable               *',
                '* verification that all incoming webhooks originate with Slack:                        *',
                '*                                                                                      *',
                '* var adapter = new SlackAdapter({clientSigningSecret: <my secret from slack>});       *',
                '*                                                                                      *',
                '****************************************************************************************',
                '>> Slack docs: https://api.slack.com/docs/verifying-requests-from-slack',
                ''
            ];
            console.warn(warning.join('\n'));
            if (!this.options.enable_incomplete) {
                throw new Error('Required: include a verificationToken or clientSigningSecret to verify incoming Events API webhooks');
            }
        }

        if (this.options.botToken) {
            this.slack = new WebClient(this.options.botToken);
            this.slack.auth.test().then((raw_identity) => {
                const identity = raw_identity as AuthTestResult;
                debug('** Slack adapter running in single team mode.');
                debug('** My Slack identity: ', identity.user, 'on team', identity.team);
                this.identity = { user_id: identity.user_id };
            }).catch((err) => {
                // This is a fatal error! Invalid credentials have been provided and the bot can't start.
                console.error(err);
                process.exit(1);
            });
        } else if (!this.options.getTokenForTeam || !this.options.getBotUserByTeam) {
            // This is a fatal error. No way to get a token to interact with the Slack API.
            console.error('Missing Slack API credentials! Provide either a botToken or a getTokenForTeam() and getBotUserByTeam function as part of the SlackAdapter options.');
            if (!this.options.enable_incomplete) {
                throw new Error('Incomplete Slack configuration');
            }
        } else if (!this.options.clientId || !this.options.clientSecret || !this.options.scopes || !this.options.redirectUri) {
            // This is a fatal error. Need info to connet to Slack via oauth
            console.error('Missing Slack API credentials! Provide clientId, clientSecret, scopes and redirectUri as part of the SlackAdapter options.');
            if (!this.options.enable_incomplete) {
                throw new Error('Incomplete Slack configuration');
            }
        } else {
            debug('** Slack adapter running in multi-team mode.');
        }

        if (!this.options.oauthVersion) {
            this.options.oauthVersion = 'v1';
        }
        this.options.oauthVersion = this.options.oauthVersion.toLowerCase();

        if (this.options.enable_incomplete) {
            const warning = [
                '',
                '****************************************************************************************',
                '* WARNING: Your adapter may be running with an incomplete/unsafe configuration.        *',
                '* - Ensure all required configuration options are present                              *',
                '* - Disable the "enable_incomplete" option!                                            *',
                '****************************************************************************************',
                ''
            ];
            console.warn(warning.join('\n'));
        }

        this.middlewares = {
            spawn: [
                async (bot, next): Promise<void> => {
                    // make the Slack API available to all bot instances.
                    bot.api = await this.getAPI(bot.getConfig('activity')).catch((err) => {
                        debug('An error occurred while trying to get API creds for team', err);
                        return next(new Error('Could not spawn a Slack API instance'));
                    });

                    next();
                }
            ]
        };
    }

    /**
     * Get a Slack API client with the correct credentials based on the team identified in the incoming activity.
     * This is used by many internal functions to get access to the Slack API, and is exposed as `bot.api` on any bot worker instances.
     * @param activity An incoming message activity
     */
    public async getAPI(activity: Partial<Activity>): Promise<WebClient> {
        // use activity.channelData.team.id (the slack team id) and get the appropriate token using getTokenForTeam
        if (this.slack) {
            return this.slack;
        } else {
            // @ts-ignore
            if (activity.conversation.team) {
                // @ts-ignore
                const token = await this.options.getTokenForTeam(activity.conversation.team);
                if (!token) {
                    throw new Error('Missing credentials for team.');
                }
                return new WebClient(token);
            } else {
                // No API can be created, this is
                debug('Unable to create API based on activity: ', activity);
            }
        }
    }

    /**
     * Get the bot user id associated with the team on which an incoming activity originated. This is used internally by the SlackMessageTypeMiddleware to identify direct_mention and mention events.
     * In single-team mode, this will pull the information from the Slack API at launch.
     * In multi-team mode, this will use the `getBotUserByTeam` method passed to the constructor to pull the information from a developer-defined source.
     * @param activity An incoming message activity
     */
    public async getBotUserByTeam(activity: Partial<Activity>): Promise<string> {
        if (this.identity) {
            return this.identity.user_id;
        } else {
            // @ts-ignore
            if (activity.conversation.team) {
                // @ts-ignore
                const user_id = await this.options.getBotUserByTeam(activity.conversation.team);
                if (!user_id) {
                    throw new Error('Missing credentials for team.');
                }
                return user_id;
            } else {
                debug('Could not find bot user id based on activity: ', activity);
            }
        }
    }

    /**
     * Get the oauth link for this bot, based on the clientId and scopes passed in to the constructor.
     *
     * An example using Botkit's internal webserver to configure the /install route:
     *
     * ```javascript
     * controller.webserver.get('/install', (req, res) => {
     *  res.redirect(controller.adapter.getInstallLink());
     * });
     * ```
     *
     * @returns A url pointing to the first step in Slack's oauth flow.
     */
    public getInstallLink(): string {
        let redirect = '';
        if (this.options.clientId && this.options.scopes) {
            if (this.options.oauthVersion === 'v2') {
                redirect = 'https://slack.com/oauth/v2/authorize?client_id=' + this.options.clientId + '&scope=' + this.options.scopes.join(',');
            } else {
                redirect = 'https://slack.com/oauth/authorize?client_id=' + this.options.clientId + '&scope=' + this.options.scopes.join(',');
            }
            if (this.options.redirectUri) {
                redirect += '&redirect_uri=' + encodeURIComponent(this.options.redirectUri);
            }

            return redirect;
        } else {
            throw new Error('getInstallLink() cannot be called without clientId and scopes in adapter options');
        }
    }

    /**
     * Validates an oauth v2 code sent by Slack during the install process.
     *
     * An example using Botkit's internal webserver to configure the /install/auth route:
     *
     * ```javascript
     * controller.webserver.get('/install/auth', async (req, res) => {
     *      try {
     *          const results = await controller.adapter.validateOauthCode(req.query.code);
     *          // make sure to capture the token and bot user id by team id...
     *          const team_id = results.team.id;
     *          const token = results.access_token;
     *          const bot_user = results.bot_user_id;
     *          // store these values in a way they'll be retrievable with getBotUserByTeam and getTokenForTeam
     *      } catch (err) {
     *           console.error('OAUTH ERROR:', err);
     *           res.status(401);
     *           res.send(err.message);
     *      }
     * });
     * ```
     * @param code the value found in `req.query.code` as part of Slack's response to the oauth flow.
     */
    public async validateOauthCode(code: string): Promise<any> {
        const slack = new WebClient();
        const details = {
            code: code,
            client_id: this.options.clientId,
            client_secret: this.options.clientSecret,
            redirect_uri: this.options.redirectUri
        };
        let results: any = {};
        if (this.options.oauthVersion === 'v2') {
            results = await slack.oauth.v2.access(details);
        } else {
            results = await slack.oauth.access(details);
        }
        if (results.ok) {
            return results;
        } else {
            throw new Error(results.error);
        }
    }

    /**
     * Formats a BotBuilder activity into an outgoing Slack message.
     * @param activity A BotBuilder Activity object
     * @returns a Slack message object with {text, attachments, channel, thread_ts} as well as any fields found in activity.channelData
     */
    public activityToSlack(activity: Partial<Activity>): any {
        const channelId = activity.conversation.id;
        // @ts-ignore ignore this non-standard field
        const thread_ts = activity.conversation.thread_ts;

        const message: any = {
            ts: activity.id,
            text: activity.text,
            attachments: activity.attachments,

            channel: channelId,
            thread_ts: thread_ts
        };

        // if channelData is specified, overwrite any fields in message object
        if (activity.channelData) {
            Object.keys(activity.channelData).forEach(function(key) {
                message[key] = activity.channelData[key];
            });
        }

        // should this message be sent as an ephemeral message
        if (message.ephemeral) {
            message.user = activity.recipient.id;
        }

        if (message.icon_url || message.icon_emoji || message.username) {
            message.as_user = false;
        }

        // as_user flag is deprecated on v2
        if (message.as_user === false && this.options.oauthVersion === 'v2') {
            delete message.as_user;
        }

        return message;
    }

    /**
     * Standard BotBuilder adapter method to send a message from the bot to the messaging API.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#sendactivities).
     * @param context A TurnContext representing the current incoming message and environment.
     * @param activities An array of outgoing activities to be sent back to the messaging API.
     */
    public async sendActivities(context: TurnContext, activities: Partial<Activity>[]): Promise<ResourceResponse[]> {
        const responses = [];
        for (let a = 0; a < activities.length; a++) {
            const activity = activities[a];
            if (activity.type === ActivityTypes.Message) {
                const message = this.activityToSlack(activity as Activity);

                try {
                    const slack = await this.getAPI(context.activity);
                    let result = null;

                    if (message.ephemeral) {
                        debug('chat.postEphemeral:', message);
                        result = await slack.chat.postEphemeral(message) as ChatPostMessageResult;
                    } else {
                        debug('chat.postMessage:', message);
                        result = await slack.chat.postMessage(message) as ChatPostMessageResult;
                    }
                    if (result.ok === true) {
                        responses.push({
                            id: result.ts,
                            activityId: result.ts,
                            conversation: { id: result.channel }
                        });
                    } else {
                        console.error('Error sending activity to API:', result);
                    }
                } catch (err) {
                    console.error('Error sending activity to API:', err);
                }
            } else {
                // If there are ever any non-message type events that need to be sent, do it here.
                debug('Unknown message type encountered in sendActivities: ', activity.type);
            }
        }

        return responses;
    }

    /**
     * Standard BotBuilder adapter method to update a previous message with new content.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#updateactivity).
     * @param context A TurnContext representing the current incoming message and environment.
     * @param activity The updated activity in the form `{id: <id of activity to update>, ...}`
     */
    public async updateActivity(context: TurnContext, activity: Partial<Activity>): Promise<void> {
        if (activity.id && activity.conversation) {
            try {
                const message = this.activityToSlack(activity as Activity);
                const slack = await this.getAPI(activity);
                const results = await slack.chat.update(message);
                if (!results.ok) {
                    console.error('Error updating activity on Slack:', results);
                }
            } catch (err) {
                console.error('Error updating activity on Slack:', err);
            }
        } else {
            throw new Error('Cannot update activity: activity is missing id');
        }
    }

    /**
     * Standard BotBuilder adapter method to delete a previous message.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#deleteactivity).
     * @param context A TurnContext representing the current incoming message and environment.
     * @param reference An object in the form `{activityId: <id of message to delete>, conversation: { id: <id of slack channel>}}`
     */
    public async deleteActivity(context: TurnContext, reference: Partial<ConversationReference>): Promise<void> {
        if (reference.activityId && reference.conversation) {
            try {
                const slack = await this.getAPI(context.activity);
                const results = await slack.chat.delete({ ts: reference.activityId, channel: reference.conversation.id });
                if (!results.ok) {
                    console.error('Error deleting activity:', results);
                }
            } catch (err) {
                console.error('Error deleting activity', err);
                throw err;
            }
        } else {
            throw new Error('Cannot delete activity: reference is missing activityId');
        }
    }

    /**
     * Standard BotBuilder adapter method for continuing an existing conversation based on a conversation reference.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#continueconversation)
     * @param reference A conversation reference to be applied to future messages.
     * @param logic A bot logic function that will perform continuing action in the form `async(context) => { ... }`
     */
    public async continueConversation(reference: Partial<ConversationReference>, logic: (context: TurnContext) => Promise<void>): Promise<void> {
        const request = TurnContext.applyConversationReference(
            { type: 'event', name: 'continueConversation' },
            reference,
            true
        );
        const context = new TurnContext(this, request);

        return this.runMiddleware(context, logic);
    }

    /**
     * Verify the signature of an incoming webhook request as originating from Slack.
     * @param req A request object from Restify or Express
     * @param res A response object from Restify or Express
     * @returns If signature is valid, returns true. Otherwise, sends a 401 error status via http response and then returns false.
     */
    private async verifySignature(req, res): Promise<boolean> {
        // is this an verified request from slack?
        if (this.options.clientSigningSecret && req.rawBody) {
            const timestamp = req.header('X-Slack-Request-Timestamp');
            const body = req.rawBody;

            const signature = [
                'v0',
                timestamp, // slack request timestamp
                body // request body
            ];
            const basestring = signature.join(':');

            const hash = 'v0=' + crypto.createHmac('sha256', this.options.clientSigningSecret)
                .update(basestring)
                .digest('hex');
            const retrievedSignature = req.header('X-Slack-Signature');

            // Compare the hash of the computed signature with the retrieved signature with a secure hmac compare function
            const validSignature = (): boolean => {
                const slackSigBuffer = Buffer.from(retrievedSignature);
                const compSigBuffer = Buffer.from(hash);

                return crypto.timingSafeEqual(slackSigBuffer, compSigBuffer);
            };

            // replace direct compare with the hmac result
            if (!validSignature()) {
                debug('Signature verification failed, Ignoring message');
                res.status(401);
                res.end();
                return false;
            }
        }

        return true;
    }

    /**
     * Accept an incoming webhook request and convert it into a TurnContext which can be processed by the bot's logic.
     * @param req A request object from Restify or Express
     * @param res A response object from Restify or Express
     * @param logic A bot logic function in the form `async(context) => { ... }`
     */
    public async processActivity(req, res, logic: (context: TurnContext) => Promise<void>): Promise<void> {
        // Create an Activity based on the incoming message from Slack.
        // There are a few different types of event that Slack might send.
        let event = req.body;

        if (event.type === 'url_verification') {
            res.status(200);
            res.header('Content-Type: text/plain');
            res.send(event.challenge);
            return;
        }

        if (!await this.verifySignature(req, res)) {

        } else if (event.payload) {
            // handle interactive_message callbacks and block_actions

            event = JSON.parse(event.payload);
            if (this.options.verificationToken && event.token !== this.options.verificationToken) {
                console.error('Rejected due to mismatched verificationToken:', event);
                res.status(403);
                res.end();
            } else {
                const activity = {
                    timestamp: new Date(),
                    channelId: 'slack',
                    conversation: {
                        id: event.channel ? event.channel.id : event.team.id, // use team id for channel id, required because modal block actions and submissions don't include channel.
                        thread_ts: event.thread_ts,
                        team: event.team.id
                    },
                    from: { id: event.user.id ?? event.bot_id },
                    recipient: { id: null },
                    channelData: event,
                    type: ActivityTypes.Event,
                    text: null
                };

                // If this is a message originating from a block_action or button click, we'll mark it as a message
                // so it gets processed in BotkitConversations
                if ((event.type === 'block_actions' || event.type === 'interactive_message') && event.actions) {
                    activity.type = ActivityTypes.Message;
                    switch (event.actions[0].type) {
                    case 'button':
                        activity.text = event.actions[0].value;
                        break;
                    case 'static_select':
                    case 'external_select':
                    case 'overflow':
                        activity.text = event.actions[0].selected_option.value;
                        break;
                    case 'users_select':
                        activity.text = event.actions[0].selected_user;
                        break;
                    case 'conversations_select':
                        activity.text = event.actions[0].selected_conversation;
                        break;
                    case 'channels_select':
                        activity.text = event.actions[0].selected_channel;
                        break;
                    case 'datepicker':
                        activity.text = event.actions[0].selected_date;
                        break;
                    default: activity.text = event.actions[0].type;
                    }
                }

                // @ts-ignore this complains because of extra fields in conversation
                activity.recipient.id = await this.getBotUserByTeam(activity as Activity);

                // create a conversation reference
                // @ts-ignore
                const context = new TurnContext(this, activity as Activity);

                context.turnState.set('httpStatus', 200);

                await this.runMiddleware(context, logic);

                // send http response back
                res.status(context.turnState.get('httpStatus'));
                if (context.turnState.get('httpBody')) {
                    res.send(context.turnState.get('httpBody'));
                } else {
                    res.end();
                }
            }
        } else if (event.type === 'event_callback') {
            // this is an event api post
            if (this.options.verificationToken && event.token !== this.options.verificationToken) {
                console.error('Rejected due to mismatched verificationToken:', event);
                res.status(403);
                res.end();
            } else {
                const activity = {
                    id: event.event.ts ? event.event.ts : event.event.event_ts,
                    timestamp: new Date(),
                    channelId: 'slack',
                    conversation: {
                        id: event.event.channel ? event.event.channel : event.event.channel_id,
                        thread_ts: event.event.thread_ts
                    },
                    from: { id: event.event.bot_id ? event.event.bot_id : event.event.user }, // TODO: bot_messages do not have a user field
                    recipient: { id: null },
                    channelData: event.event,
                    text: null,
                    type: ActivityTypes.Event
                };

                if (!activity.conversation.id) {
                    // uhoh! this doesn't have a conversation id because it might have occurred outside a channel.
                    // or be in reference to an item in a channel.
                    if (event.event.item && event.event.item.channel) {
                        activity.conversation.id = event.event.item.channel;
                    } else {
                        activity.conversation.id = event.team_id;
                    }
                }

                // Copy over the authed_users
                activity.channelData.authed_users = event.authed_users;

                // @ts-ignore this complains because of extra fields in conversation
                activity.recipient.id = await this.getBotUserByTeam(activity as Activity);

                // Normalize the location of the team id
                activity.channelData.team = event.team_id;

                // add the team id to the conversation record
                // @ts-ignore -- Tell Typescript to ignore this overload
                activity.conversation.team = activity.channelData.team;

                // If this is conclusively a message originating from a user, we'll mark it as such
                if (event.event.type === 'message' && !event.event.subtype) {
                    activity.type = ActivityTypes.Message;
                    activity.text = event.event.text;
                }

                if (!activity.conversation.id) {
                    console.error('Got Slack activity without a conversation id', event);
                    return;
                }

                // create a conversation reference
                // @ts-ignore
                const context = new TurnContext(this, activity as Activity);

                context.turnState.set('httpStatus', 200);

                await this.runMiddleware(context, logic);

                // send http response back
                res.status(context.turnState.get('httpStatus'));
                if (context.turnState.get('httpBody')) {
                    res.send(context.turnState.get('httpBody'));
                } else {
                    res.end();
                }
            }
        } else if (event.command) {
            if (this.options.verificationToken && event.token !== this.options.verificationToken) {
                console.error('Rejected due to mismatched verificationToken:', event);
                res.status(403);
                res.end();
            } else {
                // this is a slash command
                const activity = {
                    id: event.trigger_id,
                    timestamp: new Date(),
                    channelId: 'slack',
                    conversation: {
                        id: event.channel_id
                    },
                    from: { id: event.user_id },
                    recipient: { id: null },
                    channelData: event,
                    text: event.text,
                    type: ActivityTypes.Event
                };

                activity.recipient.id = await this.getBotUserByTeam(activity as Activity);

                // Normalize the location of the team id
                activity.channelData.team = event.team_id;

                // add the team id to the conversation record
                // @ts-ignore -- Tell Typescript to ignore this overload
                activity.conversation.team = activity.channelData.team;

                activity.channelData.botkitEventType = 'slash_command';

                // create a conversation reference
                // @ts-ignore
                const context = new TurnContext(this, activity as Activity);

                context.turnState.set('httpStatus', 200);

                await this.runMiddleware(context, logic);

                // send http response back
                res.status(context.turnState.get('httpStatus'));
                if (context.turnState.get('httpBody')) {
                    res.send(context.turnState.get('httpBody'));
                } else {
                    res.end();
                }
            }
        } else {
            console.error('Unknown Slack event type: ', event);
        }
    }
}

/**
 * This interface defines the options that can be passed into the SlackAdapter constructor function.
 */
export interface SlackAdapterOptions {
    /**
     * Legacy method for validating the origin of incoming webhooks. Prefer `clientSigningSecret` instead.
     */
    verificationToken?: string;
    /**
     * A token used to validate that incoming webhooks originated with Slack.
     */
    clientSigningSecret?: string;
    /**
     * A token (provided by Slack) for a bot to work on a single workspace
     */
    botToken?: string;

    /**
     * The oauth client id provided by Slack for multi-team apps
     */
    clientId?: string;
    /**
     * The oauth client secret provided by Slack for multi-team apps
     */
    clientSecret?: string;
    /**
     * A array of scope names that are being requested during the oauth process. Must match the scopes defined at api.slack.com
     */
    scopes?: string[];
    /**
     * Which version of Slack's oauth protocol to use, v1 or v2. Defaults to v1.
     */
    oauthVersion?: string;
    /**
     * The URL users will be redirected to after an oauth flow. In most cases, should be `https://<mydomain.com>/install/auth`
     */
    redirectUri?: string;

    /**
     * A method that receives a Slack team id and returns the bot token associated with that team. Required for multi-team apps.
     */
    getTokenForTeam?: (teamId: string) => Promise<string>;

    /**
     * A method that receives a Slack team id and returns the bot user id associated with that team. Required for multi-team apps.
     */
    getBotUserByTeam?: (teamId: string) => Promise<string>;

    /**
     * Allow the adapter to startup without a complete configuration.
     * This is risky as it may result in a non-functioning or insecure adapter.
     * This should only be used when getting started.
     */
    enable_incomplete?: boolean;
};

// These interfaces are necessary to cast result of web api calls
// See: http://slackapi.github.io/node-slack-sdk/typescript
interface ChatPostMessageResult extends WebAPICallResult {
    channel: string;
    ts: string;
    message: {
        text: string;
    };
}

// These interfaces are necessary to cast result of web api calls
// See: http://slackapi.github.io/node-slack-sdk/typescript
interface AuthTestResult extends WebAPICallResult {
    user: string;
    team: string;
    team_id: string;
    user_id: string;
    ok: boolean;
}
