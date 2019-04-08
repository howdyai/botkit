/**
 * @module botbuilder-adapter-twilio-sms
 */

import { Activity, ActivityTypes, BotAdapter, TurnContext, ConversationReference, ResourceResponse } from 'botbuilder';
import * as Debug from 'debug';
import * as Twilio from 'twilio';
import { rejects } from 'assert';
const debug = Debug('botkit:twilio');

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
}

/**
 * Connect Botkit or BotBuilder to Twilio's SMS service. See [TwilioAdapterOptions](#TwilioAdapterOptions) for parameters.
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
 * server.post('/api/messages', (req, res) => {
 *      adapter.processActivity(req, res, async(context) => {
 *          // do your bot logic here!
 *      });
 * });
 * ```
 */
export class TwilioAdapter extends BotAdapter {
    /**
     * Name used by Botkit plugin loader
     */
    public name: string = 'Twilio SMS Adapter';

    /**
     * Object containing one or more Botkit middlewares to bind automatically.
     */
    public middlewares;

    private options: TwilioAdapterOptions;
    private api: Twilio.Twilio; // google api


    /**
     * Create a Twilio adapter. See [TwilioAdapterOptions](#TwilioAdapterOptions) for a full definition of the allowed parameters.
     * 
     * ```javascript
     * const adapter = new TwilioAdapter({
     *      twilio_number: process.env.TWILIO_NUMBER,
     *      account_sid: process.env.TWILIO_ACCOUNT_SID,
     *      auth_token: process.env.TWILIO_AUTH_TOKEN,
     * });
     * ```
     * 
     * @param options An object containing API credentials, a webhook verification token and other options
     */
    public constructor(options: TwilioAdapterOptions) {
        super();

        this.options = options;

        if (!options.twilio_number) {
            throw new Error('twilio_number is a required part of the configuration.');
        }
        if (!options.account_sid) {
            throw new Error('account_sid  is a required part of the configuration.');
        }
        if (!options.auth_token) {
            throw new Error('auth_token is a required part of the configuration.');
        }

        this.api = Twilio(this.options.account_sid, this.options.auth_token);

        this.middlewares = {
            spawn: [
                async (bot, next) => {
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
        let message = {
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
        for (var a = 0; a < activities.length; a++) {
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
     */
    public async updateActivity(context: TurnContext, activity: Partial<Activity>): Promise<void> {
        debug('Twilio SMS does not support updating activities.');
    }

    /**
     * Twilio SMS adapter does not support deleteActivity.
     */
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
                    id: event.From,
                },
                recipient: {
                    id: event.To,
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
    }

    /**
     * Validate that requests are coming from Twilio
     * @returns If signature is valid, returns true. Otherwise, sends a 400 error status via http response and then returns false.
     */
    private async verifySignature(req, res): Promise<any> {
        var twilioSignature = req.headers['x-twilio-signature'];

        var validation_url = this.options.validation_url ||
            ((req.headers['x-forwarded-proto'] || req.protocol) + '://' + req.hostname + req.originalUrl);

        if (Twilio.validateRequest(this.options.auth_token, twilioSignature, validation_url, req.body)) {
            return true;
        } else {
            debug('Signature verification failed, Ignoring message');
            res.status(400).send({
                error: 'Invalid signature.'
            });
            return false;
        }
    }

    // TODO: add startConversation helper method for proactive
}
