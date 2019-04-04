/**
 * @module botkit
 */
import { Botkit, BotkitMessage } from './core';
import { Activity, ConversationReference, TurnContext } from 'botbuilder';

/**
 * A base class for a `bot` instance, an object that contains the information and functionality for taking action in response to an incoming message.
 * Note that adapters are likely to extend this class with additional platform-specific methods - refer to the adapter documentation for these extensions.
 */
export class BotWorker {
    private _controller: Botkit;
    private _config: any;

    /**
     * Create a new BotWorker instance. Do not call this directly - instead, use [controller.spawn()](core.md#spawn).
     * @param controller A pointer to the main Botkit controller
     * @param config An object typically containing { dialogContext, reference, context, activity }
     */
    constructor(controller: Botkit, config) {
        this._controller = controller;
        this._config = {
            ...config
        };
    }
    
    /**
     * Get a reference to the main Botkit controller.
     */
    get controller(): Botkit {
        return this._controller;
    }

    /**
     * Get a value from the BotWorker's configuration.
     * 
     * ```javascript
     * let original_context = bot.getConfig('context');
     * await original_context.sendActivity('send directly using the adapter instead of Botkit');
     * ```
     * 
     * @param {string} key The name of a value stored in the configuration
     * @returns {any} The value stored in the configuration (or null if absent)
     */
    public getConfig(key?: string) {
        if (key) {
            return this._config[key];
        } else {
            return this._config;
        }
    }

    /**
     * Send a message.
     * Message will be sent using the context originally passed in to `controller.spawn()`.
     * Primarily used for sending proactive messages, in concert with [changeContext()](#changecontext).
     * 
     * ```javascript
     * controller.on('event', async(bot, message) => {
     * 
     *  await bot.say('I received an event!');
     * 
     * });
     * ```
    * @param message A string containing the text of a reply, or more fully formed message object
    * @returns Return value will contain the results of the send action, typically `{id: <id of message>}`
     */
    public async say(message: Partial<BotkitMessage>): Promise<any> {
        return new Promise((resolve, reject) => {
            let activity = this.ensureMessageFormat(message);

            this._controller.middleware.send.run(this, activity, (err, bot, activity) => {
                // NOTE: This calls the BotBuilder middleware again...
                this._controller.adapter.continueConversation(this._config.reference, async (outgoing_context) => {
                    resolve(await outgoing_context.sendActivity(activity));
                });
            });
        });
    };

    /**
     * Reply to an incoming message.
     * Message will be sent using the context attached to the source message, which may be different than the context used to spawn the bot.
     * 
     * ```javascript
     * controller.on('event', async(bot, message) => {
    * 
    *  await bot.reply(message, 'I received an event and am replying to it.');
    * 
    * });
    * ```
    * 
    * @param src An incoming message, usually passed in to a handler function
    * @param resp A string containing the text of a reply, or more fully formed message object
    * @returns Return value will contain the results of the send action, typically `{id: <id of message>}`
    */
    public async reply(src: Partial<BotkitMessage>, resp: Partial<BotkitMessage>): Promise<any> {
        return new Promise((resolve, reject) => {
            let activity = this.ensureMessageFormat(resp);

            // get conversation reference from src
            const reference = TurnContext.getConversationReference(src.incoming_message);
            
            // use the new reference to send the outgoing message
            this._controller.middleware.send.run(this, activity, (err, bot, activity) => {
                // NOTE: This calls the BotBuilder middleware again...
                this._controller.adapter.continueConversation(reference, async (outgoing_context) => {
                    resolve(await outgoing_context.sendActivity(activity));
                });
            });
        });
    }

    /**
     * Begin a pre-defined dialog by specifying its id. The dialog will be started in the same context (same user, same channel) in which the original incoming message was received.
     * @param id id of dialog
     * @param options object containing options to be passed into the dialog
     */
    public async beginDialog(id: string, options: any) {
        if (this._config.dialogContext) {
            await this._config.dialogContext.beginDialog(id, options);

            // make sure we save the state change caused by the dialog.
            // this may also get saved again at end of turn
            await this._controller.saveState(this);
        } else {
            throw new Error('Call to beginDialog on a bot that did not receive a dialogContext during spawn');
        }
    }

    /**
     * Alter the context in which a bot instance will send messages.
     * Use this method to create or adjust a bot instance so that it can send messages to a predefined user/channel combination.
     * 
     * ```javascript
     * // get the reference field and store it.
     * const saved_reference = message.reference; 
     * 
     * // later on...
     * let bot = await controller.spawn();
     * bot.changeContext(saved_reference);
     * bot.say('Hello!');
     * ```
     * 
     * @param reference A [ConversationReference](https://docs.microsoft.com/en-us/javascript/api/botframework-schema/conversationreference?view=botbuilder-ts-latest), most likely captured from an incoming message and stored for use in proactive messaging scenarios.
     */
    public async changeContext(reference: Partial<ConversationReference>): Promise<BotWorker> {

        // change context of outbound activities to use this new address
        this._config.reference = reference;

        // Create an activity using this reference
        const activity = TurnContext.applyConversationReference(
            { type: 'message' },
            reference,
            true
        );

        // create a turn context
        const turnContext = new TurnContext(this._controller.adapter, activity as Activity);

        // create a new dialogContext so beginDialog works.
        const dialogContext = await this._controller.dialogSet.createContext(turnContext);

        this._config.context = turnContext;
        this._config.dialogContext = dialogContext;
        this._config.activity = activity;

        return this;
    }

    /**
     * Take a crudely-formed Botkit message with any sort of field (may just be a string, may be a partial message object)
     * and map it into a beautiful BotFramework Activity.
     * Any fields not found in the Activity definition will be moved to activity.channelData.
     * @params message a string or partial outgoing message object
     * @returns a properly formed Activity object
     */
    public ensureMessageFormat(message: Partial<BotkitMessage>): Partial<Activity> {

        let activity: Partial<Activity> = {};

        if (typeof(message) === 'string') {
            activity = {
                type: 'message',
                text: message,
                channelData: {}
            };
        } else {

            // set up a base message activity
            activity = {
                type: 'message',
                text: message.text,

                attachmentLayout: message.attachmentLayout,
                attachments: message.attachments,

                suggestedActions: message.suggestedActions,

                speak: message.speak,
                inputHint: message.inputHint,
                summary: message.summary,
                textFormat: message.textFormat,
                importance: message.importance,
                deliveryMode: message.deliveryMode,
                expiration: message.expiration,
                value: message.value,
                channelData: {
                    ...message.channelData
                }
            }

            // Now, copy any additional fields not in the activity into channelData
            // This way, any fields added by the developer to the root object
            // end up in the approved channelData location.
            for (var key in message) {
                if (key != 'channelData' && !activity[key]) {
                    activity.channelData[key] = message[key];
                }
            }

        }

        return activity;
    }

    /**
     * Set the http response status code for this turn
     * 
     * ```javascript
     * controller.on('event', async(bot, message) => {
     *   // respond with a 500 error code for some reason!
     *   bot.httpStatus(500);
     * });
     * ```
     * 
     * @param status {number} a valid http status code like 200 202 301 500 etc
     */
    public httpStatus(status: number) {
        this.getConfig('context').turnState.set('httpStatus', status);
    }

    /**
     * Set the http response body for this turn.
     * Use this to define the response value when the platform requires a synchronous response to the incoming webhook.
     * 
     * Example handling of a /slash command from Slack:
     * ```javascript
     * controller.on('slash_command', async(bot, message) {
     *  bot.httpBody('This is a reply to the slash command.');
     * })
     * ```
     * 
     * @param body (any) a value that will be returned as the http response body
     */
    public httpBody(body: any) {
        this.getConfig('context').turnState.set('httpBody', body);
    }

}


