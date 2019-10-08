/**
 * @module botkit
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Botkit, BotkitMessage } from './core';
import { Activity, ConversationReference } from 'botbuilder';
import { DialogTurnResult } from 'botbuilder-dialogs';
/**
 * A base class for a `bot` instance, an object that contains the information and functionality for taking action in response to an incoming message.
 * Note that adapters are likely to extend this class with additional platform-specific methods - refer to the adapter documentation for these extensions.
 */
export declare class BotWorker {
    private _controller;
    private _config;
    /**
     * Create a new BotWorker instance. Do not call this directly - instead, use [controller.spawn()](#spawn).
     * @param controller A pointer to the main Botkit controller
     * @param config An object typically containing { dialogContext, reference, context, activity }
     */
    constructor(controller: Botkit, config: any);
    /**
     * Get a reference to the main Botkit controller.
     */
    readonly controller: Botkit;
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
    getConfig(key?: string): any;
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
    say(message: Partial<BotkitMessage> | string): Promise<any>;
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
    reply(src: Partial<BotkitMessage>, resp: Partial<BotkitMessage> | string): Promise<any>;
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
    beginDialog(id: string, options?: any): Promise<void>;
    /**
     * Cancel any and all active dialogs for the current user/context.
     */
    cancelAllDialogs(): Promise<DialogTurnResult>;
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
    replaceDialog(id: string, options?: any): Promise<void>;
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
    changeContext(reference: Partial<ConversationReference>): Promise<BotWorker>;
    startConversationWithUser(reference: any): Promise<void>;
    /**
     * Take a crudely-formed Botkit message with any sort of field (may just be a string, may be a partial message object)
     * and map it into a beautiful BotFramework Activity.
     * Any fields not found in the Activity definition will be moved to activity.channelData.
     * @params message a string or partial outgoing message object
     * @returns a properly formed Activity object
     */
    ensureMessageFormat(message: Partial<BotkitMessage> | string): Partial<Activity>;
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
    httpStatus(status: number): void;
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
    httpBody(body: any): void;
}
