import { Activity, ActivityTypes, BotAdapter, TurnContext, MiddlewareSet, ConversationReference} from 'botbuilder';
import { WebClient, WebAPICallResult } from '@slack/client';
import * as Debug from 'debug';
const debug = Debug('botkit:slack');

interface SlackAdapterOptions {
    verificationToken: string;
    botToken?: string;
    getTokenForTeam?: (teamId: string)=>string;
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
    }
}

interface AuthTestResult extends WebAPICallResult {
    user: string;
    team: string;
}
  

export class SlackAdapter extends BotAdapter {

    private options: SlackAdapterOptions;
    private slack: WebClient;

    // Botkit Plugin fields
    public name: string;
    public middlewares;
    public web;
    public menu;
    private botkit; // If set, points to an instance of Botkit

    // TODO: Define options
    constructor(options: SlackAdapterOptions) {

        super();

        this.options = options;

        if (!this.options.verificationToken) {
            throw new Error('Required: include a verificationToken to verify incoming Events API webhooks');
        }

        if (this.options.botToken) {
            this.slack = new WebClient(this.options.botToken);
            this.slack.auth.test().then((raw_identity) => {
                const identity = raw_identity as AuthTestResult;
                debug('** Slack adapter running in single team mode.');
                debug('** My Slack identity: ', identity.user,'on team',identity.team);
            }).catch((err) => {
                // This is a fatal error! Invalid credentials have been provided and the bot can't start.
                console.error(err);
                process.exit(1);
            });
        } else if (!this.options.getTokenForTeam) {
            // This is a fatal error. No way to get a token to interact with the Slack API.
            console.error('Missing Slack API credentials! Provide either a botToken or a getTokenForTeam() function as part of the SlackAdapter options.');
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
                    // make the Slack API available to all bot instances.
                    bot.api = await this.getAPI(bot.getConfig('activity'));

                    bot.startPrivateConversation = async function(userId: string): Promise<any> {
                        // create the new IM channel
                        const channel = await bot.api.im.open({user: userId});

                        if (channel.ok === true) {
                            // now, switch contexts
                            return this.changeContext({
                                conversation: { id: channel.channel.id },
                                user: { id: userId },
                                channelId: 'slack',
                                // bot: { id: bot.id } // todo get bot id somehow?
                            });
                        } else {
                            console.error(channel);
                            throw new Error('Error creating IM channel');
                        }
                    }

                    bot.startConversationInChannel = async function(channelId: string, userId: string): Promise<any> {
                        return this.changeContext({
                            conversation: { id: channelId },
                            user: { id: userId },
                            channelId: 'slack',
                            // bot: { id: bot.id } // todo get bot id somehow?
                        });
                    }


                    bot.startConversationInThread = async function(channelId: string, userId: string, thread_ts: string): Promise<any> {
                        return this.changeContext({
                            conversation: { 
                                id: channelId + '-' + thread_ts,
                                // thread_ts: thread_ts
                            },
                            user: { id: userId },
                            channelId: 'slack',
                            // bot: { id: bot.id } // todo get bot id somehow?
                        });
                    }

                    /* Send a reply to an inbound message, using information collected from that inbound message */
                    bot.replyInThread = async function(src: any, resp: any): Promise<any> {
                        // make sure the  thread_ts setting is set
                        // this will be included in the conversation reference
                        src.incoming_message.conversation.id = src.incoming_message.conversation.id + '-' + (src.incoming_message.channelData.thread_ts ? src.incoming_message.channelData.thread_ts : src.incoming_message.channelData.ts);
                        return bot.reply(src, resp);
                    }

                    next();
                }
            ]
        }

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
                            install_link: this.getInstallLink(),
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
        // TODO: use activity.channelData.team.id(the slack team id) and get the appropriate token using getTokenForTeam
        if (this.slack) {
            return this.slack;
        } else {
            const token = await this.options.getTokenForTeam(activity.channelData.team.id);
            return new WebClient(token);
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

    private activityToSlack(activity: Partial<Activity>): any {

        let [ channelId, thread_ts ] = activity.conversation.id.split('-');

        const message = {
            channel: channelId,
            text: activity.text,
            // @ts-ignore
            thread_ts: thread_ts,
        };

        // TODO: add all other supported fields

        // if channelData is specified, overwrite any fields in message object
        if (activity.channelData) {
            Object.keys(activity.channelData).forEach(function(key) {
                message[key] = activity.channelData[key];
            });
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
                    const result = await slack.chat.postMessage(message) as ChatPostMessageResult;
                    if (result.ok === true) {
                        responses.push({
                            id: result.ts,
                            activityId: result.ts,
                            conversation: result.channel,
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
                throw new Error(err);
            }
        } else {
            throw new Error('Cannot delete activity: reference is missing activityId');
        }
    }

    async continueConversation(reference: ConversationReference, logic: (t: TurnContext)=>Promise<any>) {
        const request = TurnContext.applyConversationReference(
            { type: 'event', name: 'continueConversation' },
            reference,
            true
        );
        const context = new TurnContext(this, request);

        return this.runMiddleware(context, logic);
    }

    async processActivity(req, res, logic) {
        // Create an Activity based on the incoming message from Slack.
        // There are a few different types of event that Slack might send.
        let event = req.body;
        
        if (event.type === 'url_verification') {
            res.status(200);
            res.send(event.challenge);
        } else if (event.payload) {
            event = JSON.parse(event.payload);
            if (event.token !== this.options.verificationToken) {
                console.error('Rejected due to mismatched verificationToken:', event);
                res.status(403);
                res.end();
            } else {
                const activity = {
                    timestamp: new Date(),
                    channelId: 'slack',
                    conversation: { 
                        id: event.channel.id + ( event.thread_ts ? '-' + event.thread_ts : ''),
                        // thread_ts: event.thread_ts 
                    },
                    from: { id: event.user.id },
                    // recipient: this.identity.user_id,
                    channelData: event,
                    type: ActivityTypes.Event
                };

                // create a conversation reference
                // @ts-ignore
                const context = new TurnContext(this, activity as Activity);

                // send http response back
                // TODO: Dialog submissions have other options including HTTP response codes
                res.status(200);
                res.end();

                await this.runMiddleware(context, logic)
                    .catch((err) => { console.error(err.toString()); });
            }
        } else if (event.type === 'event_callback') {

            // this is an event api post
            if (event.token !== this.options.verificationToken) {
                console.error('Rejected due to mismatched verificationToken:', event);
                res.status(403);
                res.end();
            } else {
                const activity = {
                    id: event.event.ts,
                    timestamp: new Date(),
                    channelId: 'slack',
                    conversation: { 
                        id: event.event.channel + ( event.event.thread_ts ? '-' + event.event.thread_ts : ''),
                        // thread_ts: event.event.thread_ts
                    },
                    from: { id : event.event.user }, // TODO: bot_messages do not have a user field
                    // recipient: event.api_app_id, // TODO: what should this actually be? hard to make it consistent.
                    channelData: event.event,
                    text: null,
                    type: ActivityTypes.Event
                };

                // Normalize the location of the team id
                activity.channelData.team = { id: event.team_id };

                // If this is conclusively a message originating from a user, we'll mark it as such
                if (event.event.type === 'message' && !event.event.subtype) {
                    activity.type = ActivityTypes.Message;
                    activity.text = event.event.text;
                }

                // create a conversation reference
                // @ts-ignore
                const context = new TurnContext(this, activity as Activity);

                // send http response back
                res.status(200);
                res.end();

                await this.runMiddleware(context, logic)
                    .catch((err) => { console.error(err.toString()); });
            }
        } else {
            console.error('Unknown Slack event type: ', event);
        }
    }
}

export class SlackEventMiddleware extends MiddlewareSet {

    async onTurn(context, next) {
        if (context.activity.type === ActivityTypes.Event && context.activity.channelData) {
            // Handle message sub-types
            if (context.activity.channelData.subtype) {
                context.activity.type = context.activity.channelData.subtype;
            } else if (context.activity.channelData.type) {
                context.activity.type = context.activity.channelData.type;
            }
        }
        await next();
    }
}

export class SlackMessageTypeMiddleware extends MiddlewareSet {

    async onTurn(context, next) {
        if (context.activity.type === 'message' && context.activity.channelData) {
            // is this a DM, a mention, or just ambient messages passing through?
            if (context.activity.channelData.channel_type && context.activity.channelData.channel_type === 'im') {
                context.activity.type = 'direct_message';
            }
        }
        await next();
    }
}

export class SlackIdentifyBotsMiddleware extends MiddlewareSet {
    async onTurn(context, next) {
        // prevent bots from being confused by self-messages.
        // PROBLEM: we don't have our own bot_id!
        // SOLUTION: load it up and compare!
        // TODO: perhaps this should be cached somehow?
        // TODO: error checking on this API call!
        if (context.activity.channelData && context.activity.channelData.bot_id) {
            const slack = await context.adapter.getAPI(context.activity);
            const bot_info = await slack.bots.info({ bot: context.activity.channelData.bot_id });
            context.activity.from.id = bot_info.bot.user_id;

            // TODO: it is possible here to check if this is a message originating from THIS APP because bot_info has an app_id and the event also has one.
        }

        // // TODO: getting identity out of adapter is brittle!
        // if (context.activity.from === context.adapter.identity.user_id) {
        //     context.activity.type = 'self_' + context.activity.type;
        // }

        await next();
    }
}