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
const botbuilder_1 = require("botbuilder");
const botbuilder_dialogs_1 = require("botbuilder-dialogs");
const cms_1 = require("./cms");
const plugin_loader_1 = require("./plugin_loader");
const botworker_1 = require("./botworker");
const http = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const hbs = require("hbs");
const ware = require("ware");
const fs = require("fs");
const debug = require('debug')('botkit');
const FixedBotFrameworkAdapter_1 = require("./FixedBotFrameworkAdapter");
class Botkit {
    /*
     * Create a new Botkit instance
     */
    constructor(config) {
        this._events = {};
        this._triggers = {};
        this.version = require('../package.json').version;
        this.middleware = {
            spawn: new ware(),
            ingest: new ware(),
            send: new ware(),
            receive: new ware(),
        };
        // Set the path where Botkit's core lib is found.
        this.PATH = __dirname;
        this._config = Object.assign({ debug: false, webhook_uri: '/botframework/receive' }, config);
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
            console.warn('** Your bot is using memory storage and will forget everything when it reboots!');
            console.warn('** To preserve dialog state, specify a storage adapter in your Botkit config:');
            console.warn('** const controller = new Botkit({storage: myStorageAdapter});');
        }
        else {
            this.storage = this._config.storage;
        }
        this.conversationState = new botbuilder_1.ConversationState(this.storage);
        // TODO: dialogState propertyname should maybe be settable to avoid collision
        const dialogState = this.conversationState.createProperty('dialogState');
        this.dialogSet = new botbuilder_dialogs_1.DialogSet(dialogState);
        if (!this._config.webserver) {
            // Create HTTP server
            this.addDep('webserver');
            this.webserver = express();
            this.webserver.use(bodyParser.json());
            this.webserver.use(bodyParser.urlencoded({ extended: true }));
            this.http = http.createServer(this.webserver);
            hbs.registerPartials(this.PATH + '/../views/partials');
            hbs.localsAsTemplateData(this.webserver);
            // hbs.handlebars.registerHelper('raw-helper', function(options) {
            //     return options.fn();
            // });
            // From https://stackoverflow.com/questions/10232574/handlebars-js-parse-object-instead-of-object-object
            hbs.registerHelper('json', function (context) {
                return JSON.stringify(context);
            });
            this.webserver.set('views', this.PATH + '/../views');
            this.webserver.set('view engine', 'hbs');
            this.webserver.use(express.static(__dirname + '/../public'));
            if (this._config.authFunction) {
                // make sure calls to anything in /admin/ is passed through a validation function
                this.webserver.use((req, res, next) => {
                    if (req.url.match(/^\/admin/)) {
                        // console.log('CALL AUTH FUNCTION');
                        this._config.authFunction(req, res, next);
                    }
                    else {
                        next();
                    }
                });
            }
            else {
                console.warn('No authFunction specified! Web routes will be disabled.');
            }
            this.http.listen(process.env.port || process.env.PORT || 3000, () => {
                debug(`Webhook Endpoint online:  ${this.webserver.url}${this._config.webhook_uri}`);
                this.completeDep('webserver');
            });
        }
        else {
            this.webserver = this._config.webserver;
        }
        if (!this._config.adapter) {
            const adapterConfig = Object.assign({}, this._config.adapterConfig);
            debug('Configuring BotFrameworkAdapter:', adapterConfig);
            this.adapter = new FixedBotFrameworkAdapter_1.FixedBotFrameworkAdapter(adapterConfig);
        }
        else {
            debug('Using pre-configured adapter.');
            this.adapter = this._config.adapter;
        }
        if (this._config.cms && this._config.cms.cms_uri && this._config.cms.token) {
            this.cms = new cms_1.BotkitCMSHelper(this, this._config.cms);
        }
        this.configureWebhookEndpoint();
        this.plugins = new plugin_loader_1.BotkitPluginLoader(this);
        // MAGIC: Treat the adapter as a botkit plugin
        // which allows them to be carry their own platform-specific behaviors
        this.plugins.use(this.adapter);
        this.completeDep('booted');
    }
    getConfig(key) {
        if (key) {
            return this._config[key];
        }
        else {
            return this._config;
        }
    }
    addDep(name) {
        debug(`Waiting for ${name}`);
        this._deps[name] = false;
    }
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
    }
    signalBootComplete() {
        this.booted = true;
        for (let h = 0; h < this._bootCompleteHandlers.length; h++) {
            let handler = this._bootCompleteHandlers[h];
            handler.call(this);
        }
    }
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
        this.webserver.post(this._config.webhook_uri, (req, res) => {
            // Allow the Botbuilder middleware to fire.
            // this middleware is responsible for turning the incoming payload into a BotBuilder Activity
            // which we can then use to turn into a BotkitMessage
            this.adapter.processActivity(req, res, (turnContext) => __awaiter(this, void 0, void 0, function* () {
                const dialogContext = yield this.dialogSet.createContext(turnContext);
                // Continue dialog if one is present
                const dialog_results = yield dialogContext.continueDialog();
                if (dialog_results.status === botbuilder_dialogs_1.DialogTurnStatus.empty) {
                    // TODO: What do we pass in to spawn?
                    const bot = yield this.spawn(dialogContext);
                    // Turn this turnContext into a botkit message.
                    const message = {
                        type: turnContext.activity.type,
                        incoming_message: turnContext.activity,
                        context: turnContext,
                        user: turnContext.activity.from.id,
                        text: turnContext.activity.text,
                        channel: turnContext.activity.conversation.id,
                        reference: botbuilder_1.TurnContext.getConversationReference(turnContext.activity),
                    };
                    yield this.ingest(bot, message);
                }
                // console.log('SAVING STATE');
                // make sure changes to the state get persisted after the turn is over.
                yield this.conversationState.saveChanges(turnContext);
            }));
        });
    }
    saveState(bot) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.conversationState.saveChanges(bot.context);
        });
    }
    ingest(bot, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.middleware.ingest.run(bot, message, (err, bot, message) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const listen_results = yield this.listenForTriggers(bot, message);
                        if (listen_results !== false) {
                            resolve(listen_results);
                        }
                        else {
                            this.middleware.receive.run(bot, message, (err, bot, message) => __awaiter(this, void 0, void 0, function* () {
                                if (err) {
                                    return reject(err);
                                }
                                // Trigger event handlers
                                const trigger_results = yield this.trigger(message.type, bot, message);
                                resolve(trigger_results);
                            }));
                        }
                    }
                }));
            });
        });
    }
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
    testTrigger(trigger, message) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: handle for different types of triggers in the future.
            const test = new RegExp(trigger.pattern, 'i');
            if (message.text && message.text.match(test)) {
                return true;
            }
            return false;
        });
    }
    /*
     * hears()
     * instruct your bot to listen for a pattern, and do something when that pattern is heard.
     **/
    hears(patterns, events, handler) {
        if (!Array.isArray(patterns)) {
            patterns = [patterns];
        }
        if (!Array.isArray(events)) {
            events = events.split(/\s+\,\s+/);
        }
        for (var p = 0; p < patterns.length; p++) {
            for (var e = 0; e < events.length; e++) {
                var event = events[e];
                var pattern = patterns[p];
                if (!this._triggers[event]) {
                    this._triggers[event] = [];
                }
                this._triggers[event].push({
                    pattern: pattern,
                    handler: handler,
                });
            }
        }
    }
    /*
     * on()
     * instruct your bot to respond to certain event types.
     **/
    on(events, handler) {
        if (!Array.isArray(events)) {
            events = events.split(/\s+\,\s+/);
        }
        debug('Registering handler for: ', events);
        events.forEach((event) => {
            if (!this._events[event]) {
                this._events[event] = [];
            }
            this._events[event].push(handler);
        });
    }
    /*
    * trigger()
    * trigger an event
    **/
    trigger(event, bot, message) {
        return __awaiter(this, void 0, void 0, function* () {
            debug('Trigger event: ', event);
            if (this._events[event] && this._events[event].length) {
                for (var h = 0; h < this._events[event].length; h++) {
                    const handler_results = yield this._events[event][h].call(bot, bot, message);
                    if (handler_results === false) {
                        break;
                    }
                }
            }
        });
    }
    /*
    * spawn()
    * spawn a BotWorker to do stuff
    **/
    spawn(config) {
        if (config instanceof botbuilder_1.TurnContext) {
            config = {
                // TODO: What about a dialog context here?  PROBLEMATIC!
                context: config,
                reference: botbuilder_1.TurnContext.getConversationReference(config.activity),
                activity: config.activity,
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
        const worker = new botworker_1.BotWorker(this, config);
        return new Promise((resolve, reject) => {
            this.middleware.spawn.run(worker, (err, worker) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                else {
                    resolve(worker);
                }
            });
        });
    }
    spawnPrivate(src, user) {
        return new Promise((resolve, reject) => {
            const reference = botbuilder_1.TurnContext.getConversationReference(src.incoming_message);
            reference.tenant = src.incoming_message.channelData.tenant.id;
            reference.user = user;
            return this.adapter.createConversation(reference, (new_context) => __awaiter(this, void 0, void 0, function* () {
                const new_reference = botbuilder_1.TurnContext.getConversationReference(new_context.activity);
                const dc = yield this.dialogSet.createContext(new_context);
                // console.log('PRIVATE DC', JSON.stringify(dc,null,2));
                const bot = yield this.spawn({
                    dialogContext: dc,
                    reference: new_reference,
                    context: new_context,
                    activity: src.incoming_message
                });
                resolve(bot);
            }));
        });
    }
    loadModule(path) {
        debug('Load Module:', path);
        require(path)(this);
    }
    loadModules(path) {
        fs.readdirSync(path).forEach((file) => {
            this.loadModule(path + '/' + file);
        });
    }
}
exports.Botkit = Botkit;
//# sourceMappingURL=core.js.map