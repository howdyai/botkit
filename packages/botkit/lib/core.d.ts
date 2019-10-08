/**
 * @module botkit
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Activity, Storage, ConversationReference, TurnContext } from 'botbuilder';
import { Dialog, DialogSet } from 'botbuilder-dialogs';
import { BotWorker } from './botworker';
/**
 * Defines the options used when instantiating Botkit to create the main app controller with `new Botkit(options)`
 */
export interface BotkitConfiguration {
    /**
     * Path used to create incoming webhook URI.  Defaults to `/api/messages`
     */
    webhook_uri?: string;
    /**
     * Name of the dialogState property in the ConversationState that will be used to automatically track the dialog state. Defaults to `dialogState`.
     */
    dialogStateProperty?: string;
    /**
     * A fully configured BotBuilder Adapter, such as `botbuilder-adapter-slack` or `botbuilder-adapter-web`
     * The adapter is responsible for translating platform-specific messages into the format understood by Botkit and BotBuilder.
     */
    adapter?: any;
    /**
     * If using the BotFramework service, options included in `adapterConfig` will be passed to the new Adapter when created internally.
     * See [BotFrameworkAdapterSettings](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadaptersettings?view=azure-node-latest&viewFallbackFrom=botbuilder-ts-latest).
     */
    adapterConfig?: {
        [key: string]: any;
    };
    /**
     * An instance of Express used to define web endpoints.  If not specified, oen will be created internally.
     * Note: only use your own Express if you absolutely must for some reason. Otherwise, use `controller.webserver`
     */
    webserver?: any;
    /**
     * An array of middlewares that will be automatically bound to the webserver.
     * Should be in the form (req, res, next) => {}
     */
    webserver_middlewares?: any[];
    /**
     * A Storage interface compatible with [this specification](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/storage?view=botbuilder-ts-latest)
     * Defaults to the ephemeral [MemoryStorage](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/memorystorage?view=botbuilder-ts-latest) implementation.
     */
    storage?: Storage;
    /**
     * Disable webserver. If true, Botkit will not create a webserver or expose any webhook endpoints automatically. Defaults to false.
     */
    disable_webserver?: boolean;
    /**
     * Disable messages normally sent to the console during startup.
     */
    disable_console?: boolean;
}
/**
 * Defines the expected form of a message or event object being handled by Botkit.
 * Will also contain any additional fields including in the incoming payload.
 */
export interface BotkitMessage {
    /**
     * The type of event, in most cases defined by the messaging channel or adapter
     */
    type: string;
    /**
     * Text of the message sent by the user (or primary value in case of button click)
     */
    text?: string;
    /**
     * Any value field received from the platform
     */
    value?: string;
    /**
     * Unique identifier of user who sent the message. Typically contains the platform specific user id.
     */
    user: string;
    /**
     * Unique identifier of the room/channel/space in which the message was sent. Typically contains the platform specific designator for that channel.
     */
    channel: string;
    /**
     * A full [ConversationReference](https://docs.microsoft.com/en-us/javascript/api/botframework-schema/conversationreference?view=botbuilder-ts-latest) object that defines the address of the message and all information necessary to send messages back to the originating location.
     * Can be stored for later use, and used with [bot.changeContext()](#changeContext) to send proactive messages.
     */
    reference: ConversationReference;
    /**
     * The original incoming [BotBuilder Activity](https://docs.microsoft.com/en-us/javascript/api/botframework-schema/activity?view=botbuilder-ts-latest) object as created by the adapter.
     */
    incoming_message: Activity;
    /**
     * Any additional fields found in the incoming payload from the messaging platform.
     */
    [key: string]: any;
}
/**
 * A handler function passed into `hears()` or `on()` that receives a [BotWorker](#botworker) instance and a [BotkitMessage](#botkitmessage).  Should be defined as an async function and/or return a Promise.
 *
 * The form of these handlers should be:
 * ```javascript
 * async (bot, message) => {
 * // stuff.
 * }
 * ```
 *
 * For example:
 * ```javascript
 * controller.on('event', async(bot, message) => {
 *  // do somethign using bot and message like...
 *  await bot.reply(message,'Received an event.');
 * });
 * ```
 */
export interface BotkitHandler {
    (bot: BotWorker, message: BotkitMessage): Promise<any>;
}
/**
 * An interface for plugins that can contain multiple middlewares as well as an init function.
 */
export interface BotkitPlugin {
    name: string;
    middlewares?: {
        [key: string]: any[];
    };
    init?: (botkit: Botkit) => void;
}
/**
 * Create a new instance of Botkit to define the controller for a conversational app.
 * To connect Botkit to a chat platform, pass in a fully configured `adapter`.
 * If one is not specified, Botkit will expose an adapter for the Microsoft Bot Framework.
 */
export declare class Botkit {
    /**
     * _config contains the options passed to the constructor.
     * this property should never be accessed directly - use `getConfig()` instead.
     */
    private _config;
    /**
     * _events contains the list of all events for which Botkit has registered handlers.
     * Each key in this object points to an array of handler functions bound to that event.
     */
    private _events;
    /**
     * _triggers contains a list of trigger patterns htat Botkit will watch for.
     * Each key in this object points to an array of patterns and their associated handlers.
     * Each key represents an event type.
     */
    private _triggers;
    /**
     * _interrupts contains a list of trigger patterns htat Botkit will watch for and fire BEFORE firing any normal triggers.
     * Each key in this object points to an array of patterns and their associated handlers.
     * Each key represents an event type.
     */
    private _interrupts;
    /**
     * conversationState is used to track and persist the state of any ongoing conversations.
     * See https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-v4-state?view=azure-bot-service-4.0&tabs=javascript
     */
    private conversationState;
    /**
     * _deps contains a list of all dependencies that Botkit must load before being ready to operate.
     * see addDep(), completeDep() and ready()
     */
    private _deps;
    /**
     * contains an array of functions that will fire when Botkit has completely booted.
     */
    private _bootCompleteHandlers;
    /**
     * The current version of Botkit Core
     */
    version: string;
    /**
     * Middleware endpoints available for plugins and features to extend Botkit.
     * Endpoints available are: spawn, ingest, receive, send.
     *
     * To bind a middleware function to Botkit:
     * ```javascript
     * controller.middleware.receive.use(function(bot, message, next) {
     *
     *  // do something with bot or message
     *
     *  // always call next, or your bot will freeze!
     *  next();
     * });
     * ```
     */
    middleware: {
        spawn: any;
        ingest: any;
        send: any;
        receive: any;
        interpret: any;
    };
    /**
     * A list of all the installed plugins.
     */
    private plugin_list;
    /**
     * A place where plugins can extend the controller object with new methods
     */
    private _plugins;
    /**
     * a BotBuilder storage driver - defaults to MemoryStorage
     */
    storage: Storage;
    /**
     * An Express webserver
     */
    webserver: any;
    /**
     * A direct reference to the underlying HTTP server object
     */
    http: any;
    /**
     * Any BotBuilder-compatible adapter - defaults to a [BotFrameworkAdapter](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadapter?view=botbuilder-ts-latest)
     */
    adapter: any;
    /**
     * A BotBuilder DialogSet that serves as the top level dialog container for the Botkit app
     */
    dialogSet: DialogSet;
    /**
     * The path of the main Botkit SDK, used to generate relative paths
     */
    PATH: string;
    /**
     * Indicates whether or not Botkit has fully booted.
     */
    private booted;
    /**
     * Create a new Botkit instance and optionally specify a platform-specific adapter.
     * By default, Botkit will create a [BotFrameworkAdapter](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadapter?view=botbuilder-ts-latest).
     *
     * ```javascript
     * const controller = new Botkit({
     *      adapter: some_adapter,
     *      webhook_uri: '/api/messages',
     * });
     *
     * controller.on('message', async(bot, message) => {
     *      // do something!
     * });
     * ```
     *
     * @param config Configuration for this instance of Botkit
     */
    constructor(config: BotkitConfiguration);
    /**
     * Shutdown the webserver and prepare to terminate the app.
     * Causes Botkit to first emit a special `shutdown` event, process any bound handlers, and then finally terminate the webserver.
     * Bind any necessary cleanup helpers to the shutdown event - for example, close the connection to mongo.
     *
     * ```javascript
     * await controller.shutdown();
     * controller.on('shutdown', async() => {
     *      console.log('Bot is shutting down!');
     * });
     * ```
     */
    shutdown(): Promise<void>;
    /**
     * Get a value from the configuration.
     *
     * For example:
     * ```javascript
     * // get entire config object
     * let config = controller.getConfig();
     *
     * // get a specific value from the config
     * let webhook_uri = controller.getConfig('webhook_uri');
     * ```
     *
     * @param {string} key The name of a value stored in the configuration
     * @returns {any} The value stored in the configuration (or null if absent)
     */
    getConfig(key?: string): any;
    /**
     * Load a plugin module and bind all included middlewares to their respective endpoints.
     * @param plugin_or_function A plugin module in the form of function(botkit) {...} that returns {name, middlewares, init} or an object in the same form.
     */
    usePlugin(plugin_or_function: (botkit: Botkit) => BotkitPlugin | BotkitPlugin): void;
    /**
     * Called from usePlugin -- do the actual binding of middlewares for a plugin that is being loaded.
     * @param name name of the plugin
     * @param endpoints the plugin object that contains middleware endpoint definitions
     */
    private registerPlugin;
    /**
     * (Plugins only) Extend Botkit's controller with new functionality and make it available globally via the controller object.
     *
     * ```javascript
     *
     * // define the extension interface
     * let extension = {
     *         stuff: () => { return 'stuff' }
     * }
     *
     * // register the extension
     * controller.addPluginExtension('foo', extension);
     *
     * // call extension
     * controller.plugins.foo.stuff();
     *
     *
     * ```
     * @param name name of plugin
     * @param extension an object containing methods
     */
    addPluginExtension(name: string, extension: any): void;
    /**
     * Access plugin extension methods.
     * After a plugin calls `controller.addPluginExtension('foo', extension_methods)`, the extension will then be available at
     * `controller.plugins.foo`
     */
    readonly plugins: {
        [key: string]: any;
    };
    /**
     * Expose a folder to the web as a set of static files.
     * Useful for plugins that need to bundle additional assets!
     *
     * ```javascript
     * // make content of the local public folder available at http://MYBOTURL/public/myplugin
     * controller.publicFolder('/public/myplugin', __dirname + '/public);
     * ```
     * @param alias the public alias ie /myfiles
     * @param path the actual path something like `__dirname + '/public'`
     */
    publicFolder(alias: any, path: any): void;
    /**
     * Convert a local path from a plugin folder to a full path relative to the webserver's main views folder.
     * Allows a plugin to bundle views/layouts and make them available to the webserver's renderer.
     * @param path_to_view something like path.join(__dirname,'views')
     */
    getLocalView(path_to_view: any): string;
    /**
     * (For use by Botkit plugins only) - Add a dependency to Botkit's bootup process that must be marked as completed using `completeDep()`.
     * Botkit's `controller.ready()` function will not fire until all dependencies have been marked complete.
     *
     * For example, a plugin that needs to do an asynchronous task before Botkit proceeds might do:
     * ```javascript
     * controller.addDep('my_async_plugin');
     * somethingAsync().then(function() {
     *  controller.completeDep('my_async_plugin');
     * });
     * ```
     *
     * @param name {string} The name of the dependency that is being loaded.
     */
    addDep(name: string): void;
    /**
     * (For use by plugins only) - Mark a bootup dependency as loaded and ready to use
     * Botkit's `controller.ready()` function will not fire until all dependencies have been marked complete.

     * @param name {string} The name of the dependency that has completed loading.
     */
    completeDep(name: string): boolean;
    /**
     * This function gets called when all of the bootup dependencies are completely loaded.
     */
    private signalBootComplete;
    /**
     * Use `controller.ready()` to wrap any calls that require components loaded during the bootup process.
     * This will ensure that the calls will not be made until all of the components have successfully been initialized.
     *
     * For example:
     * ```javascript
     * controller.ready(() => {
     *
     *   controller.loadModules(__dirname + '/features');
     *
     * });
     * ```
     *
     * @param handler {function} A function to run when Botkit is booted and ready to run.
     */
    ready(handler: () => any): void;
    private configureWebhookEndpoint;
    /**
     * Accepts the result of a BotBuilder adapter's `processActivity()` method and processes it into a Botkit-style message and BotWorker instance
     * which is then used to test for triggers and emit events.
     * NOTE: This method should only be used in custom adapters that receive messages through mechanisms other than the main webhook endpoint (such as those received via websocket, for example)
     * @param turnContext {TurnContext} a TurnContext representing an incoming message, typically created by an adapter's `processActivity()` method.
     */
    handleTurn(turnContext: TurnContext): Promise<any>;
    /**
     * Save the current conversation state pertaining to a given BotWorker's activities.
     * Note: this is normally called internally and is only required when state changes happen outside of the normal processing flow.
     * @param bot {BotWorker} a BotWorker instance created using `controller.spawn()`
     */
    saveState(bot: BotWorker): Promise<void>;
    /**
     * Ingests a message and evaluates it for triggers, run the receive middleware, and triggers any events.
     * Note: This is normally called automatically from inside `handleTurn()` and in most cases should not be called directly.
     * @param bot {BotWorker} An instance of the bot
     * @param message {BotkitMessage} an incoming message
     */
    private processTriggersAndEvents;
    /**
     * Evaluates an incoming message for triggers created with `controller.hears()` and fires any relevant handler functions.
     * @param bot {BotWorker} An instance of the bot
     * @param message {BotkitMessage} an incoming message
     */
    private listenForTriggers;
    /**
     * Evaluates an incoming message for triggers created with `controller.interrupts()` and fires any relevant handler functions.
     * @param bot {BotWorker} An instance of the bot
     * @param message {BotkitMessage} an incoming message
     */
    private listenForInterrupts;
    /**
     * Evaluates a single trigger and return true if the incoming message matches the conditions
     * @param trigger {BotkitTrigger} a trigger definition
     * @param message {BotkitMessage} an incoming message
     */
    private testTrigger;
    /**
     * Instruct your bot to listen for a pattern, and do something when that pattern is heard.
     * Patterns will be "heard" only if the message is not already handled by an in-progress dialog.
     * To "hear" patterns _before_ dialogs are processed, use `controller.interrupts()` instead.
     *
     * For example:
     * ```javascript
     * // listen for a simple keyword
     * controller.hears('hello','message', async(bot, message) => {
     *  await bot.reply(message,'I heard you say hello.');
     * });
     *
     * // listen for a regular expression
     * controller.hears(new RegExp(/^[A-Z\s]+$/), 'message', async(bot, message) => {
     *  await bot.reply(message,'I heard a message IN ALL CAPS.');
     * });
     *
     * // listen using a function
     * controller.hears(async (message) => { return (message.intent === 'hello') }, 'message', async(bot, message) => {
     *  await bot.reply(message,'This message matches the hello intent.');
     * });
     * ```
     * @param patterns {} One or more string, regular expression, or test function
     * @param events {} A list of event types that should be evaluated for the given patterns
     * @param handler {BotkitHandler}  a function that will be called should the pattern be matched
     */
    hears(patterns: (string | RegExp | {
        (message: BotkitMessage): Promise<boolean>;
    })[] | RegExp | string | {
        (message: BotkitMessage): Promise<boolean>;
    }, events: string | string[], handler: BotkitHandler): void;
    /**
     * Instruct your bot to listen for a pattern, and do something when that pattern is heard.
     * Interruptions work just like "hears" triggers, but fire _before_ the dialog system is engaged,
     * and thus handlers will interrupt the normal flow of messages through the processing pipeline.
     *
     * ```javascript
     * controller.interrupts('help','message', async(bot, message) => {
     *
     *  await bot.reply(message,'Before anything else, you need some help!')
     *
     * });
     * ```
     * @param patterns {} One or more string, regular expression, or test function
     * @param events {} A list of event types that should be evaluated for the given patterns
     * @param handler {BotkitHandler}  a function that will be called should the pattern be matched
     */
    interrupts(patterns: (string | RegExp | {
        (message: BotkitMessage): Promise<boolean>;
    })[] | RegExp | RegExp[] | string | {
        (message: BotkitMessage): Promise<boolean>;
    }, events: string | string[], handler: BotkitHandler): void;
    /**
     * Bind a handler function to one or more events.
     *
     * ```javascript
     * controller.on('conversationUpdate', async(bot, message) => {
     *
     *  await bot.reply(message,'I received a conversationUpdate event.');
     *
     * });
     * ```
     *
     * @param events {} One or more event names
     * @param handler {BotkitHandler} a handler function that will fire whenever one of the named events is received.
     */
    on(events: string | string[], handler: BotkitHandler): void;
    /**
     * Trigger an event to be fired.  This will cause any bound handlers to be executed.
     * Note: This is normally used internally, but can be used to emit custom events.
     *
     * ```javascript
     * // fire a custom event
     * controller.trigger('my_custom_event', bot, message);
     *
     * // handle the custom event
     * controller.on('my_custom_event', async(bot, message) => {
     *  //... do something
     * });
     * ```
     *
     * @param event {string} the name of the event
     * @param bot {BotWorker} a BotWorker instance created using `controller.spawn()`
     * @param message {BotkitMessagE} An incoming message or event
     */
    trigger(event: string, bot?: BotWorker, message?: BotkitMessage): Promise<any>;
    /**
     * Create a platform-specific BotWorker instance that can be used to respond to messages or generate new outbound messages.
     * The spawned `bot` contains all information required to process outbound messages and handle dialog state, and may also contain extensions
     * for handling platform-specific events or activities.
     * @param config {any} Preferably receives a DialogContext, though can also receive a TurnContext. If excluded, must call `bot.changeContext(reference)` before calling any other method.
     */
    spawn(config?: any): Promise<BotWorker>;
    /**
     * Load a Botkit feature module
     *
     * @param p {string} path to module file
     */
    loadModule(p: string): void;
    /**
     * Load all Botkit feature modules located in a given folder.
     *
     * ```javascript
     * controller.ready(() => {
     *
     *  // load all modules from sub-folder features/
     *  controller.loadModules('./features');
     *
     * });
     * ```
     *
     * @param p {string} path to a folder of module files
     */
    loadModules(p: string): void;
    /**
     * Add a dialog to the bot, making it accessible via `bot.beginDialog(dialog_id)`
     *
     * ```javascript
     * // Create a dialog -- `BotkitConversation` is just one way to create a dialog
     * const my_dialog = new BotkitConversation('my_dialog', controller);
     * my_dialog.say('Hello');
     *
     * // Add the dialog to the Botkit controller
     * controller.addDialog(my_dialog);
     *
     * // Later on, trigger the dialog into action!
     * controller.on('message', async(bot, message) => {
     *      await bot.beginDialog('my_dialog');
     * });
     * ```
     *
     * @param dialog A dialog to be added to the bot's dialog set
     */
    addDialog(dialog: Dialog): void;
    /**
     * Bind a handler to the end of a dialog.
     * NOTE: bot worker cannot use bot.reply(), must use bot.send()
     *
     * [Learn more about handling end-of-conversation](../docs/conversations.md#handling-end-of-conversation)
     * @param dialog the dialog object or the id of the dialog
     * @param handler a handler function in the form `async(bot, dialog_results) => {}`
     */
    afterDialog(dialog: Dialog | string, handler: BotkitHandler): void;
}
