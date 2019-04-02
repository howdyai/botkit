import { Activity, ActivityTypes, BotAdapter, TurnContext, ConversationReference } from 'botbuilder';
import * as Debug from 'debug';
import * as Twilio from 'twilio';
const debug = Debug('botkit:twilio');


export interface TwilioAdapterOptions {
    twilio_number: string;
    account_sid: string;
    auth_token: string;
    validation_url?: string;
}

export class TwilioAdapter extends BotAdapter {

    // Botkit Plugin fields
    public name: string;
    public middlewares;
    public web;
    public menu;
    private options: TwilioAdapterOptions;
    private api: Twilio.Twilio; // google api

    // tell botkit to use this type of worker
    // public botkit_worker = HangoutsBotWorker;

    // TODO: Define options
    constructor(options: TwilioAdapterOptions) {
        super();

        this.options = options;

        this.name = 'Twilio SMS Adapter';

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


    private activityToTwilio(activity: any): any {

        let message = {
            body: activity.text,
            from: this.options.twilio_number,
            to: activity.conversation.id,
            mediaUrl: undefined,
        };

        if (activity.channelData && activity.channelData.mediaUrl) {
            message.mediaUrl = activity.channelData.mediaUrl;
        }

        return message;
    }

    public async sendActivities(context: TurnContext, activities: Activity[]) {
        const responses = [];
        for (var a = 0; a < activities.length; a++) {
            const activity = activities[a];
            if (activity.type === ActivityTypes.Message) {
                const message = this.activityToTwilio(activity);

                const res = await this.api.messages.create(message);
                responses.push({id: res.sid});
            } else {
                // TODO: Handle sending of other types of message?
            }
        }

        return responses;
    }

    async updateActivity(context: TurnContext, activity: Activity) {
        debug('Twilio SMS does not support updating activities.');
    }

    async deleteActivity(context: TurnContext, reference: ConversationReference) {
        debug('Twilio SMS does not support deleting activities.');
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

    async processActivity(req, res, logic) {

        this.verifyRequest(req).then(async () => {

            const event = req.body;

            const activity = {
                id: event.MessageSid,
                timestamp: new Date(),
                channelId: 'twilio-sms',
                conversation:  {
                    id: event.From
                },
                from: {
                    id: event.From
                },
                recipient: {
                    id: event.To,
                },
                text: event.Body,
                channelData: event,
                type: ActivityTypes.Message
            }

            // Detect attachments
            if (event.NumMedia && parseInt(event.NumMedia) > 0) {
                // specify a different event type for Botkit
                activity.channelData.botkitEventType = 'picture_message';
            }

            // create a conversation reference
            // @ts-ignore
            const context = new TurnContext(this, activity as Activity);

            context.turnState.set('httpStatus', 200);

            await this.runMiddleware(context, logic)
                .catch((err) => { throw err; });

            // TODO: twilio can receive an XML response as the reply instead of sending via API call...
            // worth checking httpBody?

            // But does twilio REQUIRE an XML response?

            // send http response back
            res.status(context.turnState.get('httpStatus'));
            if (context.turnState.get('httpBody')) {
                res.send(context.turnState.get('httpBody'));
            } else {
                res.end();
            }

        }).catch(() => {
            res.status(400).send({
                error: 'Invalid signature.'
            });
        })

    }

    // validate that requests are coming from twilio
    private async verifyRequest(req) {
        var twilioSignature = req.headers['x-twilio-signature'];

        var validation_url = this.options.validation_url ||
            ((req.headers['x-forwarded-proto'] || req.protocol) + '://' + req.hostname + req.originalUrl);

        if (Twilio.validateRequest(this.options.auth_token, twilioSignature, validation_url, req.body)) {
            return true;
        } else {
            throw new Error('Invalid signature');
        }
    }



}