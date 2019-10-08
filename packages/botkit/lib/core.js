"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module botkit
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const botbuilder_1 = require("botbuilder");
const botbuilder_dialogs_1 = require("botbuilder-dialogs");
const adapter_1 = require("./adapter");
const botworker_1 = require("./botworker");
const conversationState_1 = require("./conversationState");
const path = require("path");
const http = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const hbs = require("hbs");
const Ware = require("ware");
const fs = require("fs");
const debug = require('debug')('botkit');
/**
 * Create a new instance of Botkit to define the controller for a conversational app.
 * To connect Botkit to a chat platform, pass in a fully configured `adapter`.
 * If one is not specified, Botkit will expose an adapter for the Microsoft Bot Framework.
 */
class Botkit {
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
    constructor(config) {
        /**
         * _events contains the list of all events for which Botkit has registered handlers.
         * Each key in this object points to an array of handler functions bound to that event.
         */
        this._events = {};
        /**
         * _triggers contains a list of trigger patterns htat Botkit will watch for.
         * Each key in this object points to an array of patterns and their associated handlers.
         * Each key represents an event type.
         */
        this._triggers = {};
        /**
         * _interrupts contains a list of trigger patterns htat Botkit will watch for and fire BEFORE firing any normal triggers.
         * Each key in this object points to an array of patterns and their associated handlers.
         * Each key represents an event type.
         */
        this._interrupts = {};
        /**
         * The current version of Botkit Core
         */
        this.version = require('../package.json').version;
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
        this.middleware = {
            spawn: new Ware(),
            ingest: new Ware(),
            send: new Ware(),
            receive: new Ware(),
            interpret: new Ware(),
        };
        // Set the path where Botkit's core lib is found.
        this.PATH = __dirname;
        this._config = Object.assign({ webhook_uri: '/api/messages', dialogStateProperty: 'dialogState', disable_webserver: false }, config);
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
            this.storage = new botbuilder_1.MemoryStorage();
            if (this._config.disable_console !== true) {
                console.warn('** Your bot is using memory storage and will forget everything when it reboots!');
                console.warn('** To preserve dialog state, specify a storage adapter in your Botkit config:');
                console.warn('** const controller = new Botkit({storage: myStorageAdapter});');
            }
        }
        else {
            this.storage = this._config.storage;
        }
        this.conversationState = new conversationState_1.BotkitConversationState(this.storage);
        const dialogState = this.conversationState.createProperty(this.getConfig('dialogStateProperty'));
        this.dialogSet = new botbuilder_dialogs_1.DialogSet(dialogState);
        if (this._config.disable_webserver !== true) {
            if (!this._config.webserver) {
                // Create HTTP server
                this.addDep('webserver');
                this.webserver = express();
                // capture raw body
                this.webserver.use((req, res, next) => {
                    req.rawBody = '';
                    req.on('data', function (chunk) {
                        req.rawBody += chunk;
                    });
                    next();
                });
                this.webserver.use(bodyParser.json());
                this.webserver.use(bodyParser.urlencoded({ extended: true }));
                if (this._config.webserver_middlewares && this._config.webserver_middlewares.length) {
                    this._config.webserver_middlewares.forEach((middleware) => {
                        this.webserver.use(middleware);
                    });
                }
                this.http = http.createServer(this.webserver);
                hbs.localsAsTemplateData(this.webserver);
                // From https://stackoverflow.com/questions/10232574/handlebars-js-parse-object-instead-of-object-object
                hbs.registerHelper('json', function (context) {
                    return JSON.stringify(context);
                });
                this.webserver.set('view engine', 'hbs');
                this.http.listen(process.env.port || process.env.PORT || 3000, () => {
                    if (this._config.disable_console !== true) {
                        console.log(`Webhook endpoint online:  http://localhost:${process.env.PORT || 3000}${this._config.webhook_uri}`);
                    }
                    this.completeDep('webserver');
                });
            }
            else {
                this.webserver = this._config.webserver;
            }
        }
        if (!this._config.adapter) {
            const adapterConfig = Object.assign({}, this._config.adapterConfig);
            debug('Configuring BotFrameworkAdapter:', adapterConfig);
            this.adapter = new adapter_1.BotkitBotFrameworkAdapter(adapterConfig);
            if (this.webserver) {
                if (this._config.disable_console !== true) {
                    console.log(`Open this bot in Bot Framework Emulator: bfemulator://livechat.open?botUrl=` + encodeURIComponent(`http://localhost:${process.env.PORT || 3000}${this._config.webhook_uri}`));
                }
            }
        }
        else {
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
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            // trigger a special shutdown event
            yield this.trigger('shutdown');
            if (this.http) {
                this.http.close();
            }
        });
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
    getConfig(key) {
        if (key) {
            return this._config[key];
        }
        else {
            return this._config;
        }
    }
    /**
     * Load a plugin module and bind all included middlewares to their respective endpoints.
     * @param plugin_or_function A plugin module in the form of function(botkit) {...} that returns {name, middlewares, init} or an object in the same form.
     */
    usePlugin(plugin_or_function) {
        let plugin;
        if (typeof (plugin_or_function) === 'function') {
            plugin = plugin_or_function(this);
        }
        else {
            plugin = plugin_or_function;
        }
        if (plugin.name) {
            try {
                this.registerPlugin(plugin.name, plugin);
            }
            catch (err) {
                console.error('ERROR IN PLUGIN REGISTER', err);
            }
        }
    }
    /**
     * Called from usePlugin -- do the actual binding of middlewares for a plugin that is being loaded.
     * @param name name of the plugin
     * @param endpoints the plugin object that contains middleware endpoint definitions
     */
    registerPlugin(name, endpoints) {
        if (this._config.disable_console !== true) {
            console.log('Enabling plugin: ', name);
        }
        if (this.plugin_list.indexOf(name) >= 0) {
            debug('Plugin already enabled:', name);
            return;
        }
        this.plugin_list.push(name);
        if (endpoints.middlewares) {
            for (var mw in endpoints.middlewares) {
                for (var e = 0; e < endpoints.middlewares[mw].length; e++) {
                    this.middleware[mw].use(endpoints.middlewares[mw][e]);
                }
            }
        }
        if (endpoints.init) {
            try {
                endpoints.init(this);
            }
            catch (err) {
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
    addPluginExtension(name, extension) {
        debug('Plugin extension added: controller.' + name);
        this._plugins[name] = extension;
    }
    /**
     * Access plugin extension methods.
     * After a plugin calls `controller.addPluginExtension('foo', extension_methods)`, the extension will then be available at
     * `controller.plugins.foo`
     */
    get plugins() {
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
    publicFolder(alias, path) {
        if (this.webserver) {
            debug('Make folder public: ', path, 'at alias', alias);
            this.webserver.use(alias, express.static(path));
        }
        else {
            throw new Error('Cannot create public folder alias when webserver is disabled');
        }
    }
    /**
     * Convert a local path from a plugin folder to a full path relative to the webserver's main views folder.
     * Allows a plugin to bundle views/layouts and make them available to the webserver's renderer.
     * @param path_to_view something like path.join(__dirname,'views')
     */
    getLocalView(path_to_view) {
        if (this.webserver) {
            return path.relative(path.join(this.webserver.get('views')), path_to_view);
        }
        else {
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
    addDep(name) {
        debug(`Waiting for ${name}`);
        this._deps[name] = false;
    }
    /**
     * (For use by plugins only) - Mark a bootup dependency as loaded and ready to use
     * Botkit's `controller.ready()` function will not fire until all dependencies have been marked complete.

     * @param name {string} The name of the dependency that has completed loading.
     */
    completeDep(name) {
        debug(`${name} ready`);
        this._deps[name] = true;
        for (let key in this._deps) {
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
    signalBootComplete() {
        this.booted = true;
        for (let h = 0; h < this._bootCompleteHandlers.length; h++) {
            let handler = this._bootCompleteHandlers[h];
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
    ready(handler) {
        if (this.booted) {
            handler.call(this);
        }
        else {
            this._bootCompleteHandlers.push(handler);
        }
    }
    /*
     * Set up a web endpoint to receive incoming messages,
     * pass them through a normalization process, and then ingest them for processing.
     */
    configureWebhookEndpoint() {
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
        }
        else {
            throw new Error('Cannot configure webhook endpoints when webserver is disabled');
        }
    }
    /**
     * Accepts the result of a BotBuilder adapter's `processActivity()` method and processes it into a Botkit-style message and BotWorker instance
     * which is then used to test for triggers and emit events.
     * NOTE: This method should only be used in custom adapters that receive messages through mechanisms other than the main webhook endpoint (such as those received via websocket, for example)
     * @param turnContext {TurnContext} a TurnContext representing an incoming message, typically created by an adapter's `processActivity()` method.
     */
    handleTurn(turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            debug('INCOMING ACTIVITY:', turnContext.activity);
            // Create a dialog context
            const dialogContext = yield this.dialogSet.createContext(turnContext);
            // Spawn a bot worker with the dialogContext
            const bot = yield this.spawn(dialogContext);
            // Turn this turnContext into a Botkit message.
            const message = Object.assign({}, turnContext.activity.channelData, { 
                // if Botkit has further classified this message, use that sub-type rather than the Activity type
                type: (turnContext.activity.channelData && turnContext.activity.channelData.botkitEventType) ? turnContext.activity.channelData.botkitEventType : turnContext.activity.type, 
                // normalize the user, text and channel info
                user: turnContext.activity.from.id, text: turnContext.activity.text, channel: turnContext.activity.conversation.id, value: turnContext.activity.value, 
                // generate a conversation reference, for replies.
                // included so people can easily capture it for resuming
                reference: botbuilder_1.TurnContext.getConversationReference(turnContext.activity), 
                // include the context possible useful.
                context: turnContext, 
                // include the full unmodified record here
                incoming_message: turnContext.activity });
            return new Promise((resolve, reject) => {
                this.middleware.ingest.run(bot, message, (err, bot, message) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        reject(err);
                    }
                    else {
                        this.middleware.receive.run(bot, message, (err, bot, message) => __awaiter(this, void 0, void 0, function* () {
                            if (err) {
                                reject(err);
                            }
                            else {
                                const interrupt_results = yield this.listenForInterrupts(bot, message);
                                if (interrupt_results === false) {
                                    // Continue dialog if one is present
                                    const dialog_results = yield dialogContext.continueDialog();
                                    if (dialog_results && dialog_results.status === botbuilder_dialogs_1.DialogTurnStatus.empty) {
                                        yield this.processTriggersAndEvents(bot, message);
                                    }
                                }
                                // make sure changes to the state get persisted after the turn is over.
                                yield this.saveState(bot);
                                resolve();
                            }
                        }));
                    }
                }));
            });
        });
    }
    /**
     * Save the current conversation state pertaining to a given BotWorker's activities.
     * Note: this is normally called internally and is only required when state changes happen outside of the normal processing flow.
     * @param bot {BotWorker} a BotWorker instance created using `controller.spawn()`
     */
    saveState(bot) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.conversationState.saveChanges(bot.getConfig('context'));
        });
    }
    /**
     * Ingests a message and evaluates it for triggers, run the receive middleware, and triggers any events.
     * Note: This is normally called automatically from inside `handleTurn()` and in most cases should not be called directly.
     * @param bot {BotWorker} An instance of the bot
     * @param message {BotkitMessage} an incoming message
     */
    processTriggersAndEvents(bot, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this.middleware.interpret.run(bot, message, (err, bot, message) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        return reject(err);
                    }
                    const listen_results = yield this.listenForTriggers(bot, message);
                    if (listen_results !== false) {
                        resolve(listen_results);
                    }
                    else {
                        // Trigger event handlers
                        const trigger_results = yield this.trigger(message.type, bot, message);
                        resolve(trigger_results);
                    }
                }));
            }));
        });
    }
    /**
     * Evaluates an incoming message for triggers created with `controller.hears()` and fires any relevant handler functions.
     * @param bot {BotWorker} An instance of the bot
     * @param message {BotkitMessage} an incoming message
     */
    listenForTriggers(bot, message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._triggers[message.type]) {
                const triggers = this._triggers[message.type];
                for (var t = 0; t < triggers.length; t++) {
                    const test_results = yield this.testTrigger(triggers[t], message);
                    if (test_results) {
                        debug('Heard pattern: ', triggers[t].pattern);
                        const trigger_results = yield triggers[t].handler.call(this, bot, message);
                        return trigger_results;
                    }
                }
                // nothing has triggered...return false
                return false;
            }
            else {
                return false;
            }
        });
    }
    /**
     * Evaluates an incoming message for triggers created with `controller.interrupts()` and fires any relevant handler functions.
     * @param bot {BotWorker} An instance of the bot
     * @param message {BotkitMessage} an incoming message
     */
    listenForInterrupts(bot, message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._interrupts[message.type]) {
                const triggers = this._interrupts[message.type];
                for (var t = 0; t < triggers.length; t++) {
                    const test_results = yield this.testTrigger(triggers[t], message);
                    if (test_results) {
                        debug('Heard interruption: ', triggers[t].pattern);
                        const trigger_results = yield triggers[t].handler.call(this, bot, message);
                        return trigger_results;
                    }
                }
                // nothing has triggered...return false
                return false;
            }
            else {
                return false;
            }
        });
    }
    /**
     * Evaluates a single trigger and return true if the incoming message matches the conditions
     * @param trigger {BotkitTrigger} a trigger definition
     * @param message {BotkitMessage} an incoming message
     */
    testTrigger(trigger, message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (trigger.type === 'string') {
                const test = new RegExp(trigger.pattern, 'i');
                if (message.text && message.text.match(test)) {
                    return true;
                }
            }
            else if (trigger.type === 'regexp') {
                const test = trigger.pattern;
                if (message.text && message.text.match(test)) {
                    message.matches = message.text.match(test);
                    return true;
                }
            }
            else if (trigger.type === 'function') {
                const test = trigger.pattern;
                return yield test(message);
            }
            return false;
        });
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
    hears(patterns, events, handler) {
        if (!Array.isArray(patterns)) {
            patterns = [patterns];
        }
        if (typeof events === 'string') {
            events = events.split(/,/).map(e => e.trim());
        }
        debug('Registering hears for ', events);
        for (var p = 0; p < patterns.length; p++) {
            for (var e = 0; e < events.length; e++) {
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
                }
                else if (pattern instanceof RegExp) {
                    trigger.type = 'regexp';
                }
                else if (typeof pattern === 'function') {
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
    interrupts(patterns, events, handler) {
        if (!Array.isArray(patterns)) {
            patterns = [patterns];
        }
        if (typeof events === 'string') {
            events = events.split(/,/).map(e => e.trim());
        }
        debug('Registering hears for ', events);
        for (var p = 0; p < patterns.length; p++) {
            for (var e = 0; e < events.length; e++) {
                var event = events[e];
                var pattern = patterns[p];
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
                }
                else if (pattern instanceof RegExp) {
                    trigger.type = 'regexp';
                }
                else if (typeof pattern === 'function') {
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
    on(events, handler) {
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
    trigger(event, bot, message) {
        return __awaiter(this, void 0, void 0, function* () {
            debug('Trigger event: ', event);
            if (this._events[event] && this._events[event].length) {
                for (var h = 0; h < this._events[event].length; h++) {
                    try {
                        const handler_results = yield this._events[event][h].call(bot, bot, message);
                        if (handler_results === false) {
                            break;
                        }
                    }
                    catch (err) {
                        console.error('Error in trigger handler', err);
                        throw Error(err);
                    }
                }
            }
        });
    }
    /**
     * Create a platform-specific BotWorker instance that can be used to respond to messages or generate new outbound messages.
     * The spawned `bot` contains all information required to process outbound messages and handle dialog state, and may also contain extensions
     * for handling platform-specific events or activities.
     * @param config {any} Preferably receives a DialogContext, though can also receive a TurnContext. If excluded, must call `bot.changeContext(reference)` before calling any other method.
     */
    spawn(config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (config instanceof botbuilder_1.TurnContext) {
                config = {
                    dialogContext: yield this.dialogSet.createContext(config),
                    context: config,
                    reference: botbuilder_1.TurnContext.getConversationReference(config.activity),
                    activity: config.activity
                };
            }
            else if (config instanceof botbuilder_dialogs_1.DialogContext) {
                config = {
                    dialogContext: config,
                    reference: botbuilder_1.TurnContext.getConversationReference(config.context.activity),
                    context: config.context,
                    activity: config.context.activity
                };
            }
            let worker = null;
            if (this.adapter.botkit_worker) {
                let CustomBotWorker = this.adapter.botkit_worker;
                worker = new CustomBotWorker(this, config);
            }
            else {
                worker = new botworker_1.BotWorker(this, config);
            }
            return new Promise((resolve, reject) => {
                this.middleware.spawn.run(worker, (err, worker) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(worker);
                    }
                });
            });
        });
    }
    /**
     * Load a Botkit feature module
     *
     * @param p {string} path to module file
     */
    loadModule(p) {
        debug('Load Module:', p);
        require(p)(this);
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
     */
    loadModules(p) {
        // load all the .js files from this path
        fs.readdirSync(p).filter((f) => { return (path.extname(f) === '.js'); }).forEach((file) => {
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
    addDialog(dialog) {
        // add the actual dialog
        this.dialogSet.add(dialog);
        // add a wrapper dialog that will be called by bot.beginDialog
        // and is responsible for capturing the parent results
        this.dialogSet.add(new botbuilder_dialogs_1.WaterfallDialog(dialog.id + ':botkit-wrapper', [
            (step) => __awaiter(this, void 0, void 0, function* () {
                return step.beginDialog(dialog.id, step.options);
            }),
            (step) => __awaiter(this, void 0, void 0, function* () {
                let bot = yield this.spawn(step.context);
                yield this.trigger(dialog.id + ':after', bot, step.result);
                return step.endDialog(step.result);
            })
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
    afterDialog(dialog, handler) {
        let id = '';
        if (typeof (dialog) === 'string') {
            id = dialog;
        }
        else {
            id = dialog.id;
        }
        this.on(id + ':after', handler);
    }
}
exports.Botkit = Botkit;
//# sourceMappingURL=core.js.map