import { Botkit, BotkitMessage } from './core';
import { ConversationReference, TurnContext } from 'botbuilder';
import { BotkitConversation } from './conversation';
const debug = require('debug')('botkit:worker');


export class BotWorker {
    private _controller: Botkit;
    private _config: any;

    constructor(controller, config) {
        this._controller = controller;
        this._config = {
            ...config
        };

    }

    /* Return a value out of the configuration */
    public getConfig(key?: string) {
        if (key) {
            return this._config[key];
        } else {
            return this._config;
        }
    }

    /* Send a message using information passed in during spawning */
    public async say(message: Partial<BotkitMessage>): Promise<any> {
        return new Promise((resolve, reject) => {
            const activity = ensureMessageFormat(message);

            this._controller.middleware.send.run(this, activity, (err, bot, activity) => {
                // NOTE: This calls the BotBuilder middleware again...
                this._controller.adapter.continueConversation(this._config.reference, async(outgoing_context) => {
                    resolve(await outgoing_context.sendActivity(activity));
                });
            })
        });
    };

    /* Send a reply to an inbound message, using information collected from that inbound message */
    public async reply(src: Partial<BotkitMessage>, resp: Partial<BotkitMessage>): Promise<any> {
        return new Promise((resolve, reject) => {
            const activity = ensureMessageFormat(resp);

            // get conversation reference from src
            const reference = TurnContext.getConversationReference(src.incoming_message);

            // use the new reference to send the outgoing message
            this._controller.middleware.send.run(this, activity, (err, bot, activity) => {
                // NOTE: This calls the BotBuilder middleware again...
                this._controller.adapter.continueConversation(reference, async(outgoing_context) => {
                    resolve(await outgoing_context.sendActivity(activity));
                });
            });
        });

    }

    /* Begin a BotBuilder dialog */
    public async beginDialog(id, options) {
        if (this._config.dialogContext) {
            return await this._config.dialogContext.beginDialog(id, options);
        } else {
            throw new Error('Call to beginDialog on a bot that did not receive a dialogContext during spawn');
        }
    }

    // /* Create a conversation based on an incoming message */
    // public async startConversation(message: Partial<BotkitMessage>): Promise<any> {

    //     // get conversation reference from incoming message
    //     const reference = TurnContext.getConversationReference(message.incoming_message);

    //     return new BotkitConversation(reference);
    // }

}



function ensureMessageFormat(msg: any) {
    if (typeof(msg) === 'string') {
        msg = {
            text: msg
        }
    }

    return msg;
}