/**
 * @module botkit
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Activity, MemoryStorage, Storage, ConversationReference, TurnContext, BotAdapter } from 'botbuilder';
import { Dialog, DialogContext, DialogSet, DialogTurnStatus, WaterfallDialog } from 'botbuilder-dialogs';
import { BotkitBotFrameworkAdapter } from './adapter';
import { BotWorker } from './botworker';
import { BotkitConversationState } from './conversationState';
import * as path from 'path';
import * as http from 'http';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as Ware from 'ware';
import * as fs from 'fs';
import * as Debug from 'debug';

const debug = Debug('botkit');

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
    adapterConfig?: {[key: string]: any}; // object with stuff in it

    /**
     * An instance of Express used to define web endpoints.  If not specified, one will be created internally.
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
     * For an example of how to use your own Express, [see this sample code](https://github.com/howdyai/botkit/blob/main/packages/testbot/custom_express.js).
     */
    disable_webserver?: boolean;

    /**
     * Disable messages normally sent to the console during startup.
     */
    disable_console?: boolean;

    /**
     * Limit of the size of incoming JSON payloads parsed by the Express bodyParser. Defaults to '100kb'
     */
    jsonLimit?: string;

    /**
     * Limit of the size of incoming URL encoded payloads parsed by the Express bodyParser. Defaults to '100kb'
     */
    urlEncodedLimit?: string;

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
 * Defines a trigger, including the type, pattern and handler function to fire if triggered.
 */
interface BotkitTrigger {
    /**
     * string, regexp or function
     */
    type: string;
    pattern: string | RegExp | { (message: BotkitMessage): Promise<boolean> };
    handler: BotkitHandler;
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
    [key: string]: any; // allow arbitrary additional fields to be added.
}

/**
 * Create a new instance of Botkit to define the controller for a conversational app.
 * To connect Botkit to a chat platform, pass in a fully configured `adapter`.
 * If one is not specified, Botkit will expose an adapter for the Microsoft Bot Framework.
 */
export class Botkit {
    /**
     * _config contains the options passed to the constructor.
     * this property should never be accessed directly - use `getConfig()` instead.
     */
    private _config: BotkitConfiguration;

    /**
     * _events contains the list of all events for which Botkit has registered handlers.
     * Each key in this object points to an array of handler functions bound to that event.
     */
    private _events: {
        [key: string]: BotkitHandler[];
    } = {};

    /**
     * _triggers contains a list of trigger patterns htat Botkit will watch for.
     * Each key in this object points to an array of patterns and their associated handlers.
     * Each key represents an event type.
     */
    private _triggers: {
        [key: string]: BotkitTrigger[];
    } = {};

    /**
     * _interrupts contains a list of trigger patterns htat Botkit will watch for and fire BEFORE firing any normal triggers.
     * Each key in this object points to an array of patterns and their associated handlers.
     * Each key represents an event type.
     */
    private _interrupts: {
        [key: string]: BotkitTrigger[];
    } = {};

    /**
     * conversationState is used to track and persist the state of any ongoing conversations.
     * See https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-v4-state?view=azure-bot-service-4.0&tabs=javascript
     */
    private conversationState: BotkitConversationState;

    /**
     * _deps contains a list of all dependencies that Botkit must load before being ready to operate.
     * see addDep(), completeDep() and ready()
     */
    private _deps: {};

    /**
     * contains an array of functions that will fire when Botkit has completely booted.
     */
    private _bootCompleteHandlers: { (): void }[];

    /**
     * The current version of Botkit Core
     */
    public version: string = require('../package.json').version;

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
    public middleware = {
        spawn: new Ware(),
        ingest: new Ware(),
        send: new Ware(),
        receive: new Ware(),
        interpret: new Ware()
    }

    /**
     * A list of all the installed plugins.
     */
    private plugin_list: string[];

    /**
     * A place where plugins can extend the controller object with new methods
     */
    private _plugins: {
        [key: string]: any;
    };

    /**
     * a BotBuilder storage driver - defaults to MemoryStorage
     */
    public storage: Storage;

    /**
     * An Express webserver
     */
    public webserver: any;

    /**
     * A direct reference to the underlying HTTP server object
     */
    public http: any;

    /**
     * Any BotBuilder-compatible adapter - defaults to a [BotFrameworkAdapter](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadapter?view=botbuilder-ts-latest)
     */
    public adapter: any; // The base type of this is BotAdapter, but TypeScript doesn't like that we call adapter.processActivity since it is not part of the base class...

    /**
     * A BotBuilder DialogSet that serves as the top level dialog container for the Botkit app
     */
    public dialogSet: DialogSet;

    /**
     * The path of the main Botkit SDK, used to generate relative paths
     */
    public PATH: string;

    /**
     * Indicates whether or not Botkit has fully booted.
     */
    private booted: boolean;

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
    public constructor(config: BotkitConfiguration) {
        // Set the path where Botkit's core lib is found.
        this.PATH = __dirname;

        this._config = {
            webhook_uri: '/api/messages',
            dialogStateProperty: 'dialogState',
            disable_webserver: false,
            jsonLimit: '100kb',
            urlEncodedLimit: '100kb',
            ...config
        };

        // The _deps object contains references to dependencies that may take time to load and be ready.
        // new _deps are defined in the constructor.
        // when all _deps are true, the controller.ready function runs and executes all functions in order.
        this._deps = {};
        this._bootCompleteHandlers = [];
        this.booted = false;
        this.addDep('booted');

        debug('Booting Botkit ', this.version);

        if (!this._config.storage) {
            // Set up temporary storage for dialog state.
            this.storage = new MemoryStorage();
            if (this._config.disable_console !== true) {
                console.warn('** Your bot is using memory storage and will forget everything when it reboots!');
                console.warn('** To preserve dialog state, specify a storage adapter in your Botkit config:');
                console.warn('** const controller = new Botkit({storage: myStorageAdapter});');
            }
        } else {
            this.storage = this._config.storage;
        }

        this.conversationState = new BotkitConversationState(this.storage);

        const dialogState = this.conversationState.createProperty(this.getConfig('dialogStateProperty'));

        this.dialogSet = new DialogSet(dialogState);

        if (this._config.disable_webserver !== true) {
            if (!this._config.webserver) {
                // Create HTTP server
                this.addDep('webserver');

                this.webserver = express();

                // capture raw body
                this.webserver.use((req, res, next) => {
                    req.rawBody = '';
                    req.on('data', function(chunk) {
                        req.rawBody += chunk;
                    });
                    next();
                });

                this.webserver.use(bodyParser.json({ limit: this._config.jsonLimit }));
                this.webserver.use(bodyParser.urlencoded({ limit: this._config.urlEncodedLimit, extended: true }));

                if (this._config.webserver_middlewares && this._config.webserver_middlewares.length) {
                    this._config.webserver_middlewares.forEach((middleware) => {
                        this.webserver.use(middleware);
                    });
                }

                this.http = http.createServer(this.webserver);

                this.http.listen(process.env.port || process.env.PORT || 3000, () => {
                    if (this._config.disable_console !== true) {
                        console.log(`Webhook endpoint online:  http://localhost:${ process.env.PORT || 3000 }${ this._config.webhook_uri }`);
                    }
                    this.completeDep('webserver');
                });
            } else {
                this.webserver = this._config.webserver;
            }
        }

        if (!this._config.adapter) {
            const adapterConfig = { ...this._config.adapterConfig };
            debug('Configuring BotFrameworkAdapter:', adapterConfig);
            this.adapter = new BotkitBotFrameworkAdapter(adapterConfig);
            if (this.webserver) {
                if (this._config.disable_console !== true) {
                    console.log('Open this bot in Bot Framework Emulator: bfemulator://livechat.open?botUrl=' + encodeURIComponent(`http://localhost:${ process.env.PORT || 3000 }${ this._config.webhook_uri }`));
                }
            }
        } else {
            debug('Using pre-configured adapter.');
            this.adapter = this._config.adapter;
        }

        // If a webserver has been configured, auto-configure the default webhook url
        if (this.webserver) {
            this.configureWebhookEndpoint();
        }

        // initialize the plugins array.
        this.plugin_list = [];
        this._plugins = {};

        // if an adapter has been configured, add it as a plugin.
        if (this.adapter) {
            // MAGIC: Treat the adapter as a botkit plugin
            // which allows them to be carry their own platform-specific behaviors
            this.usePlugin(this.adapter);
        }

        this.completeDep('booted');
    }

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
    public async shutdown(): Promise<void> {
        // trigger a special shutdown event
        await this.trigger('shutdown');

        if (this.http) {
            this.http.close();
        }
    }

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
    public getConfig(key?: string): any {
        if (key) {
            return this._config[key];
        } else {
            return this._config;
        }
    }

    /**
     * Load a plugin module and bind all included middlewares to their respective endpoints.
     * @param plugin_or_function A plugin module in the form of function(botkit) {...} that returns {name, middlewares, init} or an object in the same form.
     */
    public usePlugin(plugin_or_function: ((botkit: Botkit) => BotkitPlugin) | BotkitPlugin): void {
        let plugin: BotkitPlugin;
        if (typeof (plugin_or_function) === 'function') {
            plugin = plugin_or_function(this);
        } else {
            plugin = plugin_or_function;
        }
        if (plugin.name) {
            try {
                this.registerPlugin(plugin.name, plugin);
            } catch (err) {
                console.error('ERROR IN PLUGIN REGISTER', err);
            }
        }
    }

    /**
     * Called from usePlugin -- do the actual binding of middlewares for a plugin that is being loaded.
     * @param name name of the plugin
     * @param endpoints the plugin object that contains middleware endpoint definitions
     */
    private registerPlugin(name: string, endpoints: BotkitPlugin): void {
        if (this._config.disable_console !== true) {
            console.log('Enabling plugin: ', name);
        }
        if (this.plugin_list.indexOf(name) >= 0) {
            debug('Plugin already enabled:', name);
            return;
        }
        this.plugin_list.push(name);

        if (endpoints.middlewares) {
            for (const mw in endpoints.middlewares) {
                for (let e = 0; e < endpoints.middlewares[mw].length; e++) {
                    this.middleware[mw].use(endpoints.middlewares[mw][e]);
                }
            }
        }

        if (endpoints.init) {
            try {
                endpoints.init(this);
            } catch (err) {
                if (err) {
                    throw new Error(err);
                }
            }
        }

        debug('Plugin Enabled: ', name);
    }

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
    public addPluginExtension(name: string, extension: any): void {
        debug('Plugin extension added: controller.' + name);
        this._plugins[name] = extension;
    }

    /**
     * Access plugin extension methods.
     * After a plugin calls `controller.addPluginExtension('foo', extension_methods)`, the extension will then be available at
     * `controller.plugins.foo`
     */
    public get plugins(): {[key: string]: any} {
        return this._plugins;
    }

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
    public publicFolder(alias, path): void {
        if (this.webserver) {
            debug('Make folder public: ', path, 'at alias', alias);
            this.webserver.use(alias, express.static(path));
        } else {
            throw new Error('Cannot create public folder alias when webserver is disabled');
        }
    }

    /**
     * Convert a local path from a plugin folder to a full path relative to the webserver's main views folder.
     * Allows a plugin to bundle views/layouts and make them available to the webserver's renderer.
     * @param path_to_view something like path.join(__dirname,'views')
     */
    public getLocalView(path_to_view): string {
        if (this.webserver) {
            return path.relative(path.join(this.webserver.get('views')), path_to_view);
        } else {
            throw new Error('Cannot get local view when webserver is disabled');
        }
    }

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
    public addDep(name: string): void {
        debug(`Waiting for ${ name }`);
        this._deps[name] = false;
    }

    /**
     * (For use by plugins only) - Mark a bootup dependency as loaded and ready to use
     * Botkit's `controller.ready()` function will not fire until all dependencies have been marked complete.

     * @param name {string} The name of the dependency that has completed loading.
     */
    public completeDep(name: string): boolean {
        debug(`${ name } ready`);

        this._deps[name] = true;

        for (const key in this._deps) {
            if (this._deps[key] === false) {
                return false;
            }
        }

        // everything is done!
        this.signalBootComplete();
        return true;
    }

    /**
     * This function gets called when all of the bootup dependencies are completely loaded.
     */
    private signalBootComplete(): void {
        this.booted = true;
        for (let h = 0; h < this._bootCompleteHandlers.length; h++) {
            const handler = this._bootCompleteHandlers[h];
            handler.call(this);
        }
    }

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
    public ready(handler: () => any): void {
        if (this.booted) {
            handler.call(this);
        } else {
            this._bootCompleteHandlers.push(handler);
        }
    }

    /*
     * Set up a web endpoint to receive incoming messages,
     * pass them through a normalization process, and then ingest them for processing.
     */
    private configureWebhookEndpoint(): void {
        if (this.webserver) {
            this.webserver.post(this._config.webhook_uri, (req, res) => {
                // Allow the Botbuilder middleware to fire.
                // this middleware is responsible for turning the incoming payload into a BotBuilder Activity
                // which we can then use to turn into a BotkitMessage
                this.adapter.processActivity(req, res, this.handleTurn.bind(this)).catch((err) => {
                    // todo: expose this as a global error handler?
                    console.error('Experienced an error inside the turn handler', err);
                    throw err;
                });
            });
        } else {
            throw new Error('Cannot configure webhook endpoints when webserver is disabled');
        }
    }

    /**
     * Accepts the result of a BotBuilder adapter's `processActivity()` method and processes it into a Botkit-style message and BotWorker instance
     * which is then used to test for triggers and emit events.
     * NOTE: This method should only be used in custom adapters that receive messages through mechanisms other than the main webhook endpoint (such as those received via websocket, for example)
     * @param turnContext {TurnContext} a TurnContext representing an incoming message, typically created by an adapter's `processActivity()` method.
     */
    public async handleTurn(turnContext: TurnContext): Promise<any> {
        debug('INCOMING ACTIVITY:', turnContext.activity);

        // Turn this turnContext into a Botkit message.
        const message: BotkitMessage = {
            // ...turnContext.activity,
            ...turnContext.activity.channelData, // start with all the fields that were in the original incoming payload. NOTE: this is a shallow copy, is that a problem?

            // if Botkit has further classified this message, use that sub-type rather than the Activity type
            type: (turnContext.activity.channelData && turnContext.activity.channelData.botkitEventType) ? turnContext.activity.channelData.botkitEventType : turnContext.activity.type,

            // normalize the user, text and channel info
            user: turnContext.activity.from.id,
            text: turnContext.activity.text,
            channel: turnContext.activity.conversation.id,

            value: turnContext.activity.value,

            // generate a conversation reference, for replies.
            // included so people can easily capture it for resuming
            reference: TurnContext.getConversationReference(turnContext.activity),

            // include the context possible useful.
            context: turnContext,

            // include the full unmodified record here
            incoming_message: turnContext.activity
        };

        // Stash the Botkit message in
        turnContext.turnState.set('botkitMessage', message);

        // Create a dialog context
        const dialogContext = await this.dialogSet.createContext(turnContext);

        // Spawn a bot worker with the dialogContext
        const bot = await this.spawn(dialogContext);

        return new Promise<void>((resolve, reject) => {
            this.middleware.ingest.run(bot, message, async (err, bot, message) => {
                if (err) {
                    reject(err);
                } else {
                    this.middleware.receive.run(bot, message, async (err, bot, message) => {
                        if (err) {
                            reject(err);
                        } else {
                            const interrupt_results = await this.listenForInterrupts(bot, message);

                            if (interrupt_results === false) {
                                // Continue dialog if one is present
                                const dialog_results = await dialogContext.continueDialog();
                                if (dialog_results && dialog_results.status === DialogTurnStatus.empty) {
                                    await this.processTriggersAndEvents(bot, message);
                                }
                            }

                            // make sure changes to the state get persisted after the turn is over.
                            await this.saveState(bot);
                            resolve();
                        }
                    });
                }
            });
        });
    }

    /**
     * Save the current conversation state pertaining to a given BotWorker's activities.
     * Note: this is normally called internally and is only required when state changes happen outside of the normal processing flow.
     * @param bot {BotWorker} a BotWorker instance created using `controller.spawn()`
     */
    public async saveState(bot: BotWorker): Promise<void> {
        await this.conversationState.saveChanges(bot.getConfig('context'));
    }

    /**
     * Ingests a message and evaluates it for triggers, run the receive middleware, and triggers any events.
     * Note: This is normally called automatically from inside `handleTurn()` and in most cases should not be called directly.
     * @param bot {BotWorker} An instance of the bot
     * @param message {BotkitMessage} an incoming message
     */
    private async processTriggersAndEvents(bot: BotWorker, message: BotkitMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            this.middleware.interpret.run(bot, message, async (err, bot, message) => {
                if (err) {
                    return reject(err);
                }
                const listen_results = await this.listenForTriggers(bot, message);

                if (listen_results !== false) {
                    resolve(listen_results);
                } else {
                    // Trigger event handlers
                    const trigger_results = await this.trigger(message.type, bot, message);

                    resolve(trigger_results);
                }
            });
        });
    }

    /**
     * Evaluates an incoming message for triggers created with `controller.hears()` and fires any relevant handler functions.
     * @param bot {BotWorker} An instance of the bot
     * @param message {BotkitMessage} an incoming message
     */
    private async listenForTriggers(bot: BotWorker, message: BotkitMessage): Promise<any> {
        if (this._triggers[message.type]) {
            const triggers = this._triggers[message.type];
            for (let t = 0; t < triggers.length; t++) {
                const test_results = await this.testTrigger(triggers[t], message);
                if (test_results) {
                    debug('Heard pattern: ', triggers[t].pattern);
                    const trigger_results = await triggers[t].handler.call(this, bot, message);
                    return trigger_results;
                }
            }

            // nothing has triggered...return false
            return false;
        } else {
            return false;
        }
    }

    /**
     * Evaluates an incoming message for triggers created with `controller.interrupts()` and fires any relevant handler functions.
     * @param bot {BotWorker} An instance of the bot
     * @param message {BotkitMessage} an incoming message
     */
    private async listenForInterrupts(bot: BotWorker, message: BotkitMessage): Promise<any> {
        if (this._interrupts[message.type]) {
            const triggers = this._interrupts[message.type];
            for (let t = 0; t < triggers.length; t++) {
                const test_results = await this.testTrigger(triggers[t], message);
                if (test_results) {
                    debug('Heard interruption: ', triggers[t].pattern);
                    const trigger_results = await triggers[t].handler.call(this, bot, message);
                    return trigger_results;
                }
            }

            // nothing has triggered...return false
            return false;
        } else {
            return false;
        }
    }

    /**
     * Evaluates a single trigger and return true if the incoming message matches the conditions
     * @param trigger {BotkitTrigger} a trigger definition
     * @param message {BotkitMessage} an incoming message
     */
    private async testTrigger(trigger: BotkitTrigger, message: BotkitMessage): Promise<boolean> {
        if (trigger.type === 'string') {
            const test = new RegExp(trigger.pattern as string, 'i');
            if (message.text && message.text.match(test)) {
                return true;
            }
        } else if (trigger.type === 'regexp') {
            const test = trigger.pattern as RegExp;
            if (message.text && message.text.match(test)) {
                message.matches = message.text.match(test);
                return true;
            }
        } else if (trigger.type === 'function') {
            const test = trigger.pattern as (message) => Promise<boolean>;
            return await test(message);
        }

        return false;
    }

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
    public hears(patterns: (string | RegExp | { (message: BotkitMessage): Promise<boolean> })[] | RegExp | string | { (message: BotkitMessage): Promise<boolean> }, events: string | string[], handler: BotkitHandler): void {
        if (!Array.isArray(patterns)) {
            patterns = [patterns];
        }

        if (typeof events === 'string') {
            events = events.split(/,/).map(e => e.trim());
        }

        debug('Registering hears for ', events);

        for (let p = 0; p < patterns.length; p++) {
            for (let e = 0; e < events.length; e++) {
                const event = events[e];
                const pattern = patterns[p];

                if (!this._triggers[event]) {
                    this._triggers[event] = [];
                }

                const trigger = {
                    pattern: pattern,
                    handler: handler,
                    type: null
                };

                if (typeof pattern === 'string') {
                    trigger.type = 'string';
                } else if (pattern instanceof RegExp) {
                    trigger.type = 'regexp';
                } else if (typeof pattern === 'function') {
                    trigger.type = 'function';
                }

                this._triggers[event].push(trigger);
            }
        }
    }

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
    public interrupts(patterns: (string | RegExp | { (message: BotkitMessage): Promise<boolean> })[] | RegExp | RegExp[] | string | { (message: BotkitMessage): Promise<boolean> }, events: string | string[], handler: BotkitHandler): void {
        if (!Array.isArray(patterns)) {
            patterns = [patterns];
        }

        if (typeof events === 'string') {
            events = events.split(/,/).map(e => e.trim());
        }
        debug('Registering hears for ', events);

        for (let p = 0; p < patterns.length; p++) {
            for (let e = 0; e < events.length; e++) {
                const event = events[e];
                const pattern = patterns[p];

                if (!this._interrupts[event]) {
                    this._interrupts[event] = [];
                }

                const trigger = {
                    pattern: pattern,
                    handler: handler,
                    type: null
                };

                if (typeof pattern === 'string') {
                    trigger.type = 'string';
                } else if (pattern instanceof RegExp) {
                    trigger.type = 'regexp';
                } else if (typeof pattern === 'function') {
                    trigger.type = 'function';
                }

                this._interrupts[event].push(trigger);
            }
        }
    }

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
    public on(events: string | string[], handler: BotkitHandler): void {
        if (typeof events === 'string') {
            events = events.split(/,/).map(e => e.trim());
        }

        debug('Registering handler for: ', events);
        events.forEach((event) => {
            if (!this._events[event]) {
                this._events[event] = [];
            }
            this._events[event].push(handler);
        });
    }

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
    public async trigger(event: string, bot?: BotWorker, message?: BotkitMessage): Promise<any> {
        debug('Trigger event: ', event);
        if (this._events[event] && this._events[event].length) {
            for (let h = 0; h < this._events[event].length; h++) {
                try {
                    const handler_results = await this._events[event][h].call(bot, bot, message);
                    if (handler_results === false) {
                        break;
                    }
                } catch (err) {
                    console.error('Error in trigger handler', err);
                    throw Error(err);
                }
            }
        }
    }

    /**
     * Create a platform-specific BotWorker instance that can be used to respond to messages or generate new outbound messages.
     * The spawned `bot` contains all information required to process outbound messages and handle dialog state, and may also contain extensions
     * for handling platform-specific events or activities.
     * @param config {any} Preferably receives a DialogContext, though can also receive a TurnContext. If excluded, must call `bot.changeContext(reference)` before calling any other method.
     * @param adapter {BotAdapter} An optional reference to a specific adapter from which the bot will be spawned. If not specified, will use the adapter from which the configuration object originates. Required for spawning proactive bots in a multi-adapter scenario.
     */
    public async spawn(config?: any, custom_adapter?: BotAdapter): Promise<BotWorker> {
        if (config instanceof TurnContext) {
            config = {
                dialogContext: await this.dialogSet.createContext(config as TurnContext),
                context: config as TurnContext,
                reference: TurnContext.getConversationReference(config.activity),
                activity: config.activity
            };
        } else if (config instanceof DialogContext) {
            config = {
                dialogContext: config,
                reference: TurnContext.getConversationReference(config.context.activity),
                context: config.context,
                activity: config.context.activity
            };
        }

        let worker: BotWorker = null;
        const adapter = custom_adapter || ((config && config.context && config.context.adapter) ? config.context.adapter : this.adapter);

        if (adapter.botkit_worker) {
            const CustomBotWorker = adapter.botkit_worker;
            worker = new CustomBotWorker(this, config);
        } else {
            worker = new BotWorker(this, config);
        }

        // make sure the adapter is available in a standard location.
        worker.getConfig().adapter = adapter;

        return new Promise((resolve, reject) => {
            this.middleware.spawn.run(worker, (err, worker) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(worker);
                }
            });
        });
    }

    /**
     * Load a Botkit feature module
     *
     * @param p {string} path to module file
     */
    public loadModule(p: string): void {
        debug('Load Module:', p);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const module = require(p);
        // Handle both CJS `module.exports` and ESM `export default` syntax.
        if (typeof module === 'function') {
            module(this);
        } else if (module && typeof module.default === 'function') {
            module.default(this);
        } else {
            throw new Error(`Failed to load '${ p }', did you export a function?`);
        }
    }

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
     * @param exts {string[]} the extensions that you would like to load (default: ['.js'])
     */
    public loadModules(p: string, exts: string[] = ['.js']): void {
        // load all the .js|.ts files from this path
        fs.readdirSync(p).filter((f) => {
            return exts.includes(path.extname(f));
        }).forEach((file) => {
            this.loadModule(path.join(p, file));
        });
    }

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
    public addDialog(dialog: Dialog): void {
        // add the actual dialog
        this.dialogSet.add(dialog);

        // add a wrapper dialog that will be called by bot.beginDialog
        // and is responsible for capturing the parent results
        this.dialogSet.add(new WaterfallDialog(dialog.id + ':botkit-wrapper', [
            async (step): Promise<any> => {
                return step.beginDialog(dialog.id, step.options);
            },
            async (step): Promise<any> => {
                const bot = await this.spawn(step.context);

                await this.trigger(dialog.id + ':after', bot, step.result);
                return step.endDialog(step.result);
            }
        ]));
    }

    /**
     * Bind a handler to the end of a dialog.
     * NOTE: bot worker cannot use bot.reply(), must use bot.send()
     *
     * [Learn more about handling end-of-conversation](../docs/conversations.md#handling-end-of-conversation)
     * @param dialog the dialog object or the id of the dialog
     * @param handler a handler function in the form `async(bot, dialog_results) => {}`
     */
    public afterDialog(dialog: Dialog | string, handler: BotkitHandler): void {
        let id = '';
        if (typeof (dialog) === 'string') {
            id = dialog as string;
        } else {
            id = dialog.id;
        }

        this.on(id + ':after', handler);
    }
}
