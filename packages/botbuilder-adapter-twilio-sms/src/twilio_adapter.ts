/**
 * @module botbuilder-adapter-twilio-sms
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity, ActivityTypes, BotAdapter, TurnContext, ConversationReference, ResourceResponse } from 'botbuilder';
import * as Debug from 'debug';
import * as Twilio from 'twilio';
import { TwilioBotWorker } from './botworker';
const debug = Debug('botkit:twilio');

/**
 * Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Twilio's SMS service.
 */
export class TwilioAdapter extends BotAdapter {
    /**
     * Name used by Botkit plugin loader
     * @ignore
     */
    public name = 'Twilio SMS Adapter';

    /**
     * Object containing one or more Botkit middlewares to bind automatically.
     * @ignore
     */
    public middlewares;

    /**
     * A specialized BotWorker for Botkit that exposes Twilio specific extension methods.
     * @ignore
     */
    public botkit_worker = TwilioBotWorker;

    private options: TwilioAdapterOptions;
    private api: Twilio.Twilio; // Twilio api

    /**
     * Create an adapter to handle incoming messages from Twilio's SMS service and translate them into a standard format for processing by your bot.
     *
     * Use with Botkit:
     *```javascript
     * const adapter = new TwilioAdapter({
     *      twilio_number: process.env.TWILIO_NUMBER,
     *      account_sid: process.env.TWILIO_ACCOUNT_SID,
     *      auth_token: process.env.TWILIO_AUTH_TOKEN,
     *      validation_url: process.env.TWILIO_VALIDATION_URL
     * });
     * const controller = new Botkit({
     *      adapter: adapter,
     *      // ... other configuration options
     * });
     * ```
     *
     * Use with BotBuilder:
     *```javascript
     * const adapter = new TwilioAdapter({
     *      twilio_number: process.env.TWILIO_NUMBER,
     *      account_sid: process.env.TWILIO_ACCOUNT_SID,
     *      auth_token: process.env.TWILIO_AUTH_TOKEN,
     *      validation_url: process.env.TWILIO_VALIDATION_URL
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
     * @param options An object containing API credentials, a webhook verification token and other options
     */
    public constructor(options: TwilioAdapterOptions) {
        super();

        this.options = options;

        if (!options.twilio_number) {
            const err = 'twilio_number is a required part of the configuration.';
            if (!this.options.enable_incomplete) {
                throw new Error(err);
            } else {
                console.error(err);
            }
        }
        if (!options.account_sid) {
            const err = 'account_sid  is a required part of the configuration.';
            if (!this.options.enable_incomplete) {
                throw new Error(err);
            } else {
                console.error(err);
            }
        }
        if (!options.auth_token) {
            const err = 'auth_token is a required part of the configuration.';
            if (!this.options.enable_incomplete) {
                throw new Error(err);
            } else {
                console.error(err);
            }
        }

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

        try {
            this.api = Twilio(this.options.account_sid, this.options.auth_token);
        } catch (err) {
            if (err) {
                if (!this.options.enable_incomplete) {
                    throw new Error(err);
                } else {
                    console.error(err);
                }
            }
        }

        this.middlewares = {
            spawn: [
                async (bot, next): Promise<void> => {
                    bot.api = this.api;
                    next();
                }
            ]
        };
    }

    /**
     * Formats a BotBuilder activity into an outgoing Twilio SMS message.
     * @param activity A BotBuilder Activity object
     * @returns a Twilio message object with {body, from, to, mediaUrl}
     */
    private activityToTwilio(activity: Partial<Activity>): any {
        const message = {
            body: activity.text,
            from: this.options.twilio_number,
            to: activity.conversation.id,
            mediaUrl: undefined
        };

        if (activity.channelData && activity.channelData.mediaUrl) {
            message.mediaUrl = activity.channelData.mediaUrl;
        }

        return message;
    }

    /**
     * Standard BotBuilder adapter method to send a message from the bot to the messaging API.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#sendactivities).
     * @param context A TurnContext representing the current incoming message and environment. (Not used)
     * @param activities An array of outgoing activities to be sent back to the messaging API.
     */
    public async sendActivities(context: TurnContext, activities: Partial<Activity>[]): Promise<ResourceResponse[]> {
        const responses = [];
        for (let a = 0; a < activities.length; a++) {
            const activity = activities[a];
            if (activity.type === ActivityTypes.Message) {
                const message = this.activityToTwilio(activity as Activity);

                const res = await this.api.messages.create(message);
                responses.push({ id: res.sid });
            } else {
                debug('Unknown message type encountered in sendActivities: ', activity.type);
            }
        }

        return responses;
    }

    /**
     * Twilio SMS adapter does not support updateActivity.
     * @ignore
     */
    // eslint-disable-next-line
     public async updateActivity(context: TurnContext, activity: Partial<Activity>): Promise<void> {
        debug('Twilio SMS does not support updating activities.');
    }

    /**
     * Twilio SMS adapter does not support deleteActivity.
     * @ignore
     */
    // eslint-disable-next-line
     public async deleteActivity(context: TurnContext, reference: Partial<ConversationReference>): Promise<void> {
        debug('Twilio SMS does not support deleting activities.');
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
     * Accept an incoming webhook request and convert it into a TurnContext which can be processed by the bot's logic.
     * @param req A request object from Restify or Express
     * @param res A response object from Restify or Express
     * @param logic A bot logic function in the form `async(context) => { ... }`
     */
    public async processActivity(req, res, logic: (context: TurnContext) => Promise<void>): Promise<void> {
        if (await this.verifySignature(req, res) === true) {
            const event = req.body;

            const activity = {
                id: event.MessageSid,
                timestamp: new Date(),
                channelId: 'twilio-sms',
                conversation: {
                    id: event.From
                },
                from: {
                    id: event.From
                },
                recipient: {
                    id: event.To
                },
                text: event.Body,
                channelData: event,
                type: ActivityTypes.Message
            };

            // Detect attachments
            if (event.NumMedia && parseInt(event.NumMedia) > 0) {
                // specify a different event type for Botkit
                activity.channelData.botkitEventType = 'picture_message';
            }

            // create a conversation reference
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
    }

    /**
     * Validate that requests are coming from Twilio
     * @returns If signature is valid, returns true. Otherwise, sends a 400 error status via http response and then returns false.
     */
    private async verifySignature(req, res): Promise<any> {
        let twilioSignature;
        let validation_url;

        // Restify style
        if (!req.headers) {
            twilioSignature = req.header('x-twilio-signature');

            validation_url = this.options.validation_url ||
                (req.headers['x-forwarded-proto'] || (req.isSecure()) ? 'https' : 'http') + '://' + req.headers.host + req.url;
        } else {
        // express style
            twilioSignature = req.headers['x-twilio-signature'];

            validation_url = this.options.validation_url ||
                ((req.headers['x-forwarded-proto'] || req.protocol) + '://' + req.hostname + req.originalUrl);
        }

        if (twilioSignature && Twilio.validateRequest(this.options.auth_token, twilioSignature, validation_url, req.body)) {
            return true;
        } else {
            debug('Signature verification failed, Ignoring message');
            res.status(400);
            res.send({
                error: 'Invalid signature.'
            });
            return false;
        }
    }
}

/**
 * Parameters passed to the TwilioAdapter constructor.
 */
export interface TwilioAdapterOptions {
    /**
     * The phone number associated with this Twilio app, in the format 1XXXYYYZZZZ
     */
    twilio_number: string;
    /**
     * The account SID from the twilio account
     */
    account_sid: string;
    /**
     * An api auth token associated with the twilio account
     */
    auth_token: string;
    /**
     * An optional url to override the automatically generated url signature used to validate incoming requests -- [See Twilio docs about securing your endpoint.](https://www.twilio.com/docs/usage/security#validating-requests)
     */
    validation_url?: string;
    /**
     * Allow the adapter to startup without a complete configuration.
     * This is risky as it may result in a non-functioning or insecure adapter.
     * This should only be used when getting started.
     */
    enable_incomplete?: boolean;

}
