import { ActivityTypes, BotAdapter, TurnContext } from 'botbuilder';
var WebSocket = require('ws');
import * as Debug from 'debug';
const debug = Debug('botkit:websocket');

export class WebsocketAdapter extends BotAdapter {

    // TODO: add typedefs to these
    private _config: any;

    public name: string;
    public middlewares;

    public wss;

    constructor(config) {
        super();

        this._config = {
            ...config
        };

        // Botkit Plugin additions
        this.name = 'Websocket Adapter';
        this.middlewares = {
            // spawn: [
            //     async (bot, next) => {
            //         // make webex api directly available on a botkit instance.
            //         bot.api = this._api;
            //         next();
            //     }
            // ]
        }
    
    }

    // Botkit init function, called only when used alongside Botkit
    public init(botkit) {

        // when the bot is ready, register the webhook subscription with the Webex API
        botkit.ready(() => {
            
            let server = botkit.http;
            this.wss = new WebSocket.Server({
                server
            });

        })

    }

    async sendActivities(context, activities) {
        const responses = [];
        for (var a = 0; a < activities.length; a++) {
            const activity = activities[a];
            debug('OUTGOING ACTIVITY', activity);
            // const message = {
            //     roomId: activity.conversation ? activity.conversation.id : null,
            //     toPersonId: activity.conversation ? null : activity.recipient.id,
            //     text: activity.text,
            // }

            // responses.push(await this._api.messages.create(message));
        
        }

        return responses;
    }

    async updateActivity(context, activity) {
        if (activity.activityId && activity.conversation) {

        } else {
            throw new Error('Cannot update activity: activity is missing id');
        }
    }

    async deleteActivity(context, reference) {
        if (reference.activityId && reference.conversation) {
        } else {
            throw new Error('Cannot delete activity: reference is missing activityId');
        }
    }

    async continueConversation(reference, logic) {
        const request = TurnContext.applyConversationReference(
            { type: 'event', name: 'continueConversation' },
            reference,
            true
        );
        const context = new TurnContext(this, request);

        return this.runMiddleware(context, logic);
    }

    async processActivity(req, res, logic) {

        res.status(200);
        res.end();

        const activity = req.body;
        
        // create a conversation reference
        const context = new TurnContext(this, activity);

        this.runMiddleware(context, logic)
        .catch((err) => { console.error(err.toString()); });

    }
}