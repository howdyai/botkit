import { Activity, ActivityTypes, BotAdapter, TurnContext, MiddlewareSet, ConversationReference } from 'botbuilder';
import { WebClient, WebAPICallResult } from '@slack/client';
import { SlackBotWorker } from './botworker';
import * as crypto from 'crypto';
import * as Debug from 'debug';
const debug = Debug('botkit:slack');

interface SlackAdapterOptions {
    verificationToken?: string;
    clientSigningSecret?: string;
    botToken?: string;
    getTokenForTeam?: (teamId: string) => string;
    getBotUserByTeam?: (teamId: string) => string;
    clientId?: string;
    clientSecret?: string;
    scopes?: string[];
    redirectUri: string;
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

interface AuthTestResult extends WebAPICallResult {
    user: string;
    team: string;
    team_id: string;
    user_id: string;
    ok: boolean;
}

const userIdByBotId: { [key: string]: string } = {};
const userIdByTeamId: { [key: string]: string } = {};

export class SlackAdapter extends BotAdapter {
    private options: SlackAdapterOptions;
    private slack: WebClient;
    private identity: {
        user_id: string;
    };

    // Botkit Plugin fields
    public name: string;
    public middlewares;
    public web;
    public menu;
    private botkit; // If set, points to an instance of Botkit

    // tell botkit to use this type of worker
    public botkit_worker = SlackBotWorker;

    // TODO: Define options
    constructor(options: SlackAdapterOptions) {
        super();

        this.options = options;

        /*
        * Check for security options. If these are not set, malicious actors can
        * spoof messages from Slack.
        * These will be required in upcoming versions of Botkit.
        */
        if (!this.options.verificationToken && !this.options.clientSigningSecret) {
            const warning = [
                ``,
                `****************************************************************************************`,
                `* WARNING: Your bot is operating without recommended security mechanisms in place.     *`,
                `* Initialize your adapter with a clientSigningSecret parameter to enable               *`,
                `* verification that all incoming webhooks originate with Slack:                        *`,
                `*                                                                                      *`,
                `* var adapter = new SlackAdapter({clientSigningSecret: <my secret from slack>});       *`,
                `*                                                                                      *`,
                `****************************************************************************************`,
                `>> Slack docs: https://api.slack.com/docs/verifying-requests-from-slack`,
                ``,
            ];
            console.warn(warning.join('\n'));
            throw new Error('Required: include a verificationToken or clientSigningSecret to verify incoming Events API webhooks');
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
            process.exit(1);
        } else if (!this.options.clientId || !this.options.clientSecret || !this.options.scopes || !this.options.redirectUri) {
            // This is a fatal error. Need info to connet to Slack via oauth
            console.error('Missing Slack API credentials! Provide clientId, clientSecret, scopes and redirectUri as part of the SlackAdapter options.');
            process.exit(1);
        } else {
            debug('** Slack adapter running in multi-team mode.');
        }

        this.name = 'Slack Adapter';
        this.middlewares = {
            spawn: [
                async (bot, next) => {
                    // // make the Slack API available to all bot instances.
                    bot.api = await this.getAPI(bot.getConfig('activity')).catch((err) => {
                        return next(new Error('Could not spawn a Slack API instance'));
                    });

                    next();
                }
            ]
        };

        this.web = [
            {
                method: 'get',
                url: '/admin/slack',
                handler: (req, res) => {
                    res.render(
                        this.botkit.plugins.localView(__dirname + '/../views/slack.hbs'),
                        {
                            slack_config: this.options,
                            botkit_config: this.botkit.getConfig(),
                            host: req.get('host'),
                            protocol: req.protocol,
                            install_link: this.getInstallLink()
                        }
                    );
                }
            }
        ];

        this.menu = [
            {
                title: 'Slack',
                url: '/admin/slack',
                icon: '#'
            }
        ];
    }

    public init(botkit) {
        // capture Botkit controller for use in web endpoints
        this.botkit = botkit;
    }

    public async getAPI(activity: Activity) {
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

    public async getBotUserByTeam(activity: Activity) {
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

    public getInstallLink(): string {
        if (this.options.clientId && this.options.scopes) {
            const redirect = 'https://slack.com/oauth/authorize?client_id=' + this.options.clientId + '&scope=' + this.options.scopes.join(',');
            return redirect;
        } else {
            console.warn('getInstallLink() cannot be called without clientId and scopes in adapter options');
            return '';
        }
    }

    public async validateOauthCode(code: string) {
        const slack = new WebClient();
        const results = await slack.oauth.access({
            code: code,
            client_id: this.options.clientId,
            client_secret: this.options.clientSecret,
            redirect_uri: this.options.redirectUri
        });
        if (results.ok) {
            return results;
        } else {
            // TODO: What should we return here?
            throw new Error(results.error);
        }
    }

    private activityToSlack(activity: any): any {
        let channelId = activity.conversation.id;
        let thread_ts = activity.conversation.thread_ts;

        const message = {
            channel: channelId,
            text: activity.text,
            thread_ts: activity.thread_ts ? activity.thread_ts : thread_ts,
            username: activity.username || null,
            reply_broadcast: activity.reply_broadcast || null,
            parse: activity.parse || null,
            link_names: activity.link_names || null,
            attachments: activity.attachments ? JSON.stringify(activity.attachments) : null,
            blocks: activity.blocks ? JSON.stringify(activity.blocks) : null,
            unfurl_links: typeof activity.unfurl_links !== 'undefined' ? activity.unfurl_links : null,
            unfurl_media: typeof activity.unfurl_media !== 'undefined' ? activity.unfurl_media : null,
            icon_url: activity.icon_url || null,
            icon_emoji: activity.icon_emoji || null,
            as_user: activity.as_user || true,
            ephemeral: activity.ephemeral || false,
            user: null
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

        return message;
    }

    public async sendActivities(context: TurnContext, activities: Activity[]) {
        const responses = [];
        for (var a = 0; a < activities.length; a++) {
            const activity = activities[a];
            if (activity.type === ActivityTypes.Message) {
                const message = this.activityToSlack(activity);

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
                            conversation: result.channel
                        });
                    } else {
                        console.error('Error sending activity to Slack:', result);
                    }
                } catch (err) {
                    console.error('Error sending activity to Slack:', err);
                }
            } else {
                // TODO: Handle sending of other types of message?
            }
        }

        return responses;
    }

    async updateActivity(context: TurnContext, activity: Activity) {
        if (activity.id && activity.conversation) {
            try {
                const message = this.activityToSlack(activity);

                // set the id of the message to be updated
                message.ts = activity.id;
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

    async deleteActivity(context: TurnContext, reference: ConversationReference) {
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

    async continueConversation(reference: ConversationReference, logic: (t: TurnContext) => Promise<any>) {
        const request = TurnContext.applyConversationReference(
            { type: 'event', name: 'continueConversation' },
            reference,
            true
        );
        const context = new TurnContext(this, request);

        return this.runMiddleware(context, logic);
    }

    async verifySignature(req, res) {
         // is this an verified request from slack?
         if (this.options.clientSigningSecret && req.rawBody) {
            let timestamp = req.header('X-Slack-Request-Timestamp');
            let body = req.rawBody;

            let signature = [
                'v0',
                timestamp, // slack request timestamp
                body // request body
            ];
            let basestring = signature.join(':');

            const hash = 'v0=' + crypto.createHmac('sha256', this.options.clientSigningSecret)
                .update(basestring)
                .digest('hex');
            let retrievedSignature = req.header('X-Slack-Signature');

            // Compare the hash of the computed signature with the retrieved signature with a secure hmac compare function
            const validSignature = () => {

                const slackSigBuffer = Buffer.from(retrievedSignature);
                const compSigBuffer = Buffer.from(hash);

                return crypto.timingSafeEqual(slackSigBuffer, compSigBuffer);
            }

            // replace direct compare with the hmac result
            if (!validSignature()) {
                debug('Signature verification failed, Ignoring message');
                res.status(401);
                return false;
            }
        }

        return true;
    }

    async processActivity(req, res, logic) {
        // Create an Activity based on the incoming message from Slack.
        // There are a few different types of event that Slack might send.
        let event = req.body;

        if (event.type === 'url_verification') {
            res.status(200);
            res.send(event.challenge);
            return;
        }

        if (!await this.verifySignature(req, res)) {
            return;
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
                        id: event.channel.id,
                        thread_ts: event.thread_ts,
                        team: event.team.id
                    },
                    from: { id: event.bot_id ? event.bot_id : event.user.id },
                    channelData: event,
                    type: ActivityTypes.Event
                };

                // create a conversation reference
                // @ts-ignore
                const context = new TurnContext(this, activity as Activity);

                context.turnState.set('httpStatus', 200);

                await this.runMiddleware(context, logic)
                    .catch((err) => { throw err; });

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
                    id: event.event.ts,
                    timestamp: new Date(),
                    channelId: 'slack',
                    conversation: {
                        id: event.event.channel,
                        thread_ts: event.event.thread_ts
                    },
                    from: { id: event.event.bot_id ? event.event.bot_id : event.event.user }, // TODO: bot_messages do not have a user field
                    // recipient: event.api_app_id, // TODO: what should this actually be? hard to make it consistent.
                    channelData: event.event,
                    text: null,
                    type: ActivityTypes.Event
                };

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

                // create a conversation reference
                // @ts-ignore
                const context = new TurnContext(this, activity as Activity);

                context.turnState.set('httpStatus', 200);

                await this.runMiddleware(context, logic)
                    .catch((err) => { throw err; });

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
                    channelData: event,
                    text: event.text,
                    type: ActivityTypes.Event
                };

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

                await this.runMiddleware(context, logic)
                    .catch((err) => { throw err; });

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
