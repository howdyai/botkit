/**
 * @module botkit
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Botkit, BotkitMessage } from './core';
import { Activity, ConversationAccount, ConversationReference, ConversationParameters, TurnContext } from 'botbuilder';
import { DialogTurnResult, Dialog } from 'botbuilder-dialogs';

/**
 * A base class for a `bot` instance, an object that contains the information and functionality for taking action in response to an incoming message.
 * Note that adapters are likely to extend this class with additional platform-specific methods - refer to the adapter documentation for these extensions.
 */
export class BotWorker {
    private _controller: Botkit;
    private _config: any;

    /**
     * Create a new BotWorker instance. Do not call this directly - instead, use [controller.spawn()](#spawn).
     * @param controller A pointer to the main Botkit controller
     * @param config An object typically containing { dialogContext, reference, context, activity }
     */
    public constructor(controller: Botkit, config) {
        this._controller = controller;
        this._config = {
            ...config
        };
    }

    /**
     * Get a reference to the main Botkit controller.
     */
    public get controller(): Botkit {
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
    public getConfig(key?: string): any {
        if (key) {
            return this._config[key];
        } else {
            return this._config;
        }
    }

    /**
     * Send a message using whatever context the `bot` was spawned in or set using [changeContext()](#changecontext) --
     * or more likely, one of the platform-specific helpers like
     * [startPrivateConversation()](../reference/slack.md#startprivateconversation) (Slack),
     * [startConversationWithUser()](../reference/twilio-sms.md#startconversationwithuser) (Twilio SMS),
     * and [startConversationWithUser()](../reference/facebook.md#startconversationwithuser) (Facebook Messenger).
     * Be sure to check the platform documentation for others - most adapters include at least one.
     *
     * Simple use in event handler (acts the same as bot.reply)
     * ```javascript
     * controller.on('event', async(bot, message) => {
     *
     *  await bot.say('I received an event!');
     *
     * });
     * ```
     *
     * Use with a freshly spawned bot and bot.changeContext:
     * ```javascript
     * let bot = controller.spawn(OPTIONS);
     * bot.changeContext(REFERENCE);
     * bot.say('ALERT! I have some news.');
     * ```
     *
     * Use with multi-field message object:
     * ```javascript
     * controller.on('event', async(bot, message) => {
     *      bot.say({
     *          text: 'I heard an event',
     *          attachments: [
     *              title: message.type,
     *              text: `The message was of type ${ message.type }`,
     *              // ...
     *          ]
     *      });
     * });
     * ```
     *
     * @param message A string containing the text of a reply, or more fully formed message object
     * @returns Return value will contain the results of the send action, typically `{id: <id of message>}`
     */
    public async say(message: Partial<BotkitMessage> | string): Promise<any> {
        return new Promise((resolve, reject) => {
            const activity = this.ensureMessageFormat(message);

            this._controller.middleware.send.run(this, activity, async (err, bot, activity) => {
                if (err) {
                    return reject(err);
                }
                resolve(await this.getConfig('context').sendActivity(activity));
            });
        });
    };

    /**
     * Reply to an incoming message.
     * Message will be sent using the context of the source message, which may in some cases be different than the context used to spawn the bot.
     *
     * Note that like [bot.say()](#say), `reply()` can take a string or a message object.
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
    public async reply(src: Partial<BotkitMessage>, resp: Partial<BotkitMessage> | string): Promise<any> {
        let activity = this.ensureMessageFormat(resp);

        // Get conversation reference from src
        const reference = TurnContext.getConversationReference(src.incoming_message);

        activity = TurnContext.applyConversationReference(activity, reference);

        return this.say(activity);
    }

    /**
     * Begin a pre-defined dialog by specifying its id. The dialog will be started in the same context (same user, same channel) in which the original incoming message was received.
     * [See "Using Dialogs" in the core documentation.](../index.md#using-dialogs)
     *
     * ```javascript
     * controller.hears('hello', 'message', async(bot, message) => {
     *      await bot.beginDialog(GREETINGS_DIALOG);
     * });
     * ```
     * @param id id of dialog
     * @param options object containing options to be passed into the dialog
     */
    public async beginDialog(id: string, options?: any): Promise<void> {
        if (this._config.dialogContext) {
            await this._config.dialogContext.beginDialog(id + ':botkit-wrapper', {
                user: this.getConfig('context').activity.from.id,
                channel: this.getConfig('context').activity.conversation.id,
                ...options
            });

            // make sure we save the state change caused by the dialog.
            // this may also get saved again at end of turn
            await this._controller.saveState(this);
        } else {
            throw new Error('Call to beginDialog on a bot that did not receive a dialogContext during spawn');
        }
    }

    /**
     * Cancel any and all active dialogs for the current user/context.
     */
    public async cancelAllDialogs(): Promise<DialogTurnResult> {
        if (this._config.dialogContext) {
            return this._config.dialogContext.cancelAllDialogs();
        }
    }

    /**
     * Get a reference to the active dialog
     * @returns a reference to the active dialog or undefined if no dialog is active
     */
    public getActiveDialog(): Dialog | undefined {
        return this.getConfig('dialogContext').activeDialog;
    }

    /**
     * Check if any dialog is active or not
     * @returns true if there is an active dialog, otherwise false
     */
    public hasActiveDialog(): boolean {
        return !!this.getActiveDialog();
    }

    /**
     * Check to see if a given dialog is currently active in the stack
     * @param id The id of a dialog to look for in the dialog stack
     * @returns true if dialog with id is located anywhere in the dialog stack
     */
    public isDialogActive(id: string): boolean {
        if (this.getConfig('dialogContext').stack.length) {
            return (this.getConfig('dialogContext').stack.filter((d) => d.id === id).length > 0);
        }
        return false;
    }

    /**
     * Replace any active dialogs with a new a pre-defined dialog by specifying its id. The dialog will be started in the same context (same user, same channel) in which the original incoming message was received.
     * [See "Using Dialogs" in the core documentation.](../index.md#using-dialogs)
     *
     * ```javascript
     * controller.hears('hello', 'message', async(bot, message) => {
     *      await bot.replaceDialog(GREETINGS_DIALOG);
     * });
     * ```
     * @param id id of dialog
     * @param options object containing options to be passed into the dialog
     */
    public async replaceDialog(id: string, options?: any): Promise<void> {
        if (this._config.dialogContext) {
            await this._config.dialogContext.replaceDialog(id + ':botkit-wrapper', {
                user: this.getConfig('context').activity.from.id,
                channel: this.getConfig('context').activity.conversation.id,
                ...options
            });

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
        const turnContext = new TurnContext(this.getConfig('adapter'), activity as Activity);

        // create a new dialogContext so beginDialog works.
        const dialogContext = await this._controller.dialogSet.createContext(turnContext);

        this._config.context = turnContext;
        this._config.dialogContext = dialogContext;
        this._config.activity = activity;

        return this;
    }

    public async startConversationWithUser(reference: any): Promise<void> {
        // this code is mostly copied from BotFrameworkAdapter.createConversation

        if (!reference.serviceUrl) { throw new Error('bot.startConversationWithUser(): missing serviceUrl.'); }

        // Create conversation
        const parameters: ConversationParameters = { bot: reference.bot, members: [reference.user], isGroup: false, activity: null, channelData: null };
        const client = this.getConfig('adapter').createConnectorClient(reference.serviceUrl);

        // Mix in the tenant ID if specified. This is required for MS Teams.
        if (reference.conversation && reference.conversation.tenantId) {
            // Putting tenantId in channelData is a temporary solution while we wait for the Teams API to be updated
            parameters.channelData = { tenant: { id: reference.conversation.tenantId } };

            // Permanent solution is to put tenantId in parameters.tenantId
            parameters.tenantId = reference.conversation.tenantId;
        }

        const response = await client.conversations.createConversation(parameters);

        // Initialize request and copy over new conversation ID and updated serviceUrl.
        const request: Partial<Activity> = TurnContext.applyConversationReference(
            { type: 'event', name: 'createConversation' },
            reference,
            true
        );

        const conversation: ConversationAccount = {
            // fallback to existing conversation id because Emulator will respond without a response.id AND needs to stay in same channel.
            // This should be fixed by Emulator. https://github.com/microsoft/BotFramework-Emulator/issues/2097
            id: response.id || reference.conversation.id,
            isGroup: false,
            conversationType: null,
            tenantId: null,
            name: null
        };
        request.conversation = conversation;

        if (response.serviceUrl) { request.serviceUrl = response.serviceUrl; }

        // Create context and run middleware
        const turnContext: TurnContext = this.getConfig('adapter').createContext(request);

        // create a new dialogContext so beginDialog works.
        const dialogContext = await this._controller.dialogSet.createContext(turnContext);

        this._config.context = turnContext;
        this._config.dialogContext = dialogContext;
        this._config.activity = request;
    }

    /**
     * Take a crudely-formed Botkit message with any sort of field (may just be a string, may be a partial message object)
     * and map it into a beautiful BotFramework Activity.
     * Any fields not found in the Activity definition will be moved to activity.channelData.
     * @params message a string or partial outgoing message object
     * @returns a properly formed Activity object
     */
    public ensureMessageFormat(message: Partial<BotkitMessage> | string): Partial<Activity> {
        if (typeof (message) === 'string') {
            return {
                type: 'message',
                text: message,
                channelData: {}
            };
        } else {
            // set up a base message activity
            // https://docs.microsoft.com/en-us/javascript/api/botframework-schema/activity?view=botbuilder-ts-latest
            const activity: Partial<Activity> = {
                type: message.type || 'message',
                text: message.text,

                action: message.action,
                attachmentLayout: message.attachmentLayout,
                attachments: message.attachments,

                channelData: {
                    ...message.channelData
                },
                channelId: message.channelId,
                code: message.code,
                conversation: message.conversation,

                deliveryMode: message.deliveryMode,
                entities: message.entities,
                expiration: message.expiration,
                from: message.from,
                historyDisclosed: message.historyDisclosed,
                id: message.id,
                importance: message.importance,
                inputHint: message.inputHint,
                label: message.label,
                listenFor: message.listenFor,
                locale: message.locale,
                localTimestamp: message.localTimestamp,
                localTimezone: message.localTimezone,
                membersAdded: message.membersAdded,
                membersRemoved: message.membersRemoved,
                name: message.name,
                reactionsAdded: message.reactionsAdded,
                reactionsRemoved: message.reactionsRemoved,
                recipient: message.recipient,
                relatesTo: message.relatesTo,
                replyToId: message.replyToId,
                semanticAction: message.semanticAction,
                serviceUrl: message.serviceUrl,
                speak: message.speak,
                suggestedActions: message.suggestedActions,
                summary: message.summary,
                textFormat: message.textFormat,
                textHighlights: message.textHighlights,
                timestamp: message.timestamp,
                topicName: message.topicName,
                value: message.value,
                valueType: message.valueType
            };

            // Now, copy any additional fields not in the activity into channelData
            // This way, any fields added by the developer to the root object
            // end up in the approved channelData location.
            for (const key in message) {
                if (key !== 'channelData' && !Object.prototype.hasOwnProperty.call(activity, key)) {
                    activity.channelData[key] = message[key];
                }
            }
            return activity;
        }
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
    public httpStatus(status: number): void {
        this.getConfig('context').turnState.set('httpStatus', status);
    }

    /**
     * Set the http response body for this turn.
     * Use this to define the response value when the platform requires a synchronous response to the incoming webhook.
     *
     * Example handling of a /slash command from Slack:
     * ```javascript
     * controller.on('slash_command', async(bot, message) => {
     *  bot.httpBody('This is a reply to the slash command.');
     * })
     * ```
     *
     * @param body (any) a value that will be returned as the http response body
     */
    public httpBody(body: any): void {
        this.getConfig('context').turnState.set('httpBody', body);
    }
}
