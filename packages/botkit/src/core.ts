/**
 * @module botkit
 */
import { BotFrameworkAdapter, MemoryStorage,  Storage, ConversationReference, TurnContext } from 'botbuilder';
import { DialogContext, DialogSet, DialogTurnStatus } from 'botbuilder-dialogs';
import { BotkitCMSHelper } from './cms';
import { BotkitPluginLoader } from './plugin_loader';
import { BotWorker } from './botworker';
import { BotkitConversationState } from './conversationState';
import * as path from 'path';
import * as http from 'http';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as hbs from 'hbs';

import * as ware from 'ware';
import * as fs from 'fs';

const debug = require('debug')('botkit');

export interface BotkitConfiguration {
    debug?: boolean;
    webhook_uri?: string;
    adapter?: BotFrameworkAdapter;
    adapterConfig?: {[key: string]: any}; // object with stuff in it
    cms?: {[key: string]: any};
    webserver?: any;
    storage?: Storage;
    authFunction?: (req, res, next) => void; 
}

export interface BotkitMessage {
    type: string;
    text?: string;
    user: string;
    channel: string;
    reference: ConversationReference;
    incoming_message: {[key: string]: any};
    [key: string]: any; // allow any other fields to live alongside the defined fields.
}

export class Botkit {

    private _config: BotkitConfiguration;
    private _events: {
        [key: string]: { (bot: BotWorker, event: any): Promise<boolean> }[];
    } = {};

    private _triggers: {
        [key: string]: { 
            pattern: string | RegExp | { (message: BotkitMessage):  Promise<boolean> };
            type: string;
            handler: (bot: BotWorker, message: BotkitMessage) => Promise<any>;
        }[];
    } = {};

    private _interrupts: {
        [key: string]: { 
            pattern: string | RegExp | { (message: BotkitMessage):  Promise<boolean> };
            type: string;
            handler: (bot: BotWorker, message: BotkitMessage) => Promise<any>;
        }[];
    } = {};

    private conversationState: BotkitConversationState;

    private _deps: {};
    private _bootCompleteHandlers: { (): void }[];

    public cms: BotkitCMSHelper; // access to the botkit cms helper

    public version: string = require('../package.json').version;

    public middleware = {
        spawn: new ware(),
        ingest: new ware(),
        send: new ware(),
        receive: new ware(),
    }

    public storage: Storage;
    public webserver: any;
    public http: any;
    public adapter: any; // TODO: this should be BotAdapter, but missing adapter.processActivity causes errors
    public dialogSet: DialogSet;
    public plugins: BotkitPluginLoader;

    public PATH: string;

    public booted: boolean;

    /* 
     * Create a new Botkit instance
     * @param config Configuration for this instance of Botkit
     */
    constructor(config) {
        
        // Set the path where Botkit's core lib is found.
        this.PATH = __dirname;

        this._config = {
            debug: false,
            webhook_uri: '/botframework/receive',
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
            console.warn('** Your bot is using memory storage and will forget everything when it reboots!');
            console.warn('** To preserve dialog state, specify a storage adapter in your Botkit config:');
            console.warn('** const controller = new Botkit({storage: myStorageAdapter});');
        } else {
            this.storage = this._config.storage;
        }

        this.conversationState = new BotkitConversationState(this.storage);

        // TODO: dialogState propertyname should maybe be settable to avoid collision
        const dialogState = this.conversationState.createProperty('dialogState');

        this.dialogSet = new DialogSet(dialogState);

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
            hbs.registerHelper('json', function(context) {
                return JSON.stringify(context);
            });

            this.webserver.set('views', this.PATH + '/../views');
            this.webserver.set('view engine', 'hbs');
            this.webserver.use(express.static(__dirname + '/../public'));

            if (this._config.authFunction) {
                // make sure calls to anything in /admin/ is passed through a validation function
                this.webserver.use((req, res, next) => {
                    if (req.url.match(/^\/admin/)) {
                        this._config.authFunction(req, res, next);
                    } else {
                        next();
                    }
                });
            } else {
                console.warn('No authFunction specified! Web routes will be disabled.');
            }

            this.http.listen(process.env.port || process.env.PORT || 3000, () => {
                debug(`Webhook Endpoint online:  ${ this.webserver.url }${ this._config.webhook_uri }`);
                this.completeDep('webserver');
            });
        } else {
            this.webserver = this._config.webserver;
        }

        if (!this._config.adapter) {
            const adapterConfig = {...this._config.adapterConfig};
            debug('Configuring BotFrameworkAdapter:', adapterConfig);
            this.adapter = new BotFrameworkAdapter(adapterConfig);
        } else {
            debug('Using pre-configured adapter.');
            this.adapter = this._config.adapter;
        }

        if (this._config.cms && this._config.cms.cms_uri && this._config.cms.token) {
            this.cms = new BotkitCMSHelper(this, this._config.cms);
        }

        this.configureWebhookEndpoint();

        this.plugins = new BotkitPluginLoader(this);

        // MAGIC: Treat the adapter as a botkit plugin
        // which allows them to be carry their own platform-specific behaviors
        this.plugins.use(this.adapter);

        this.completeDep('booted');
    }

    /* Get a value from the configuration
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

    public addDep(name) {
        debug(`Waiting for ${ name }`);
        this._deps[name] = false;
    }

    public completeDep(name) {
        debug(`${ name } ready`);

        this._deps[name] = true;
        
        for (let key in this._deps) {
            if (this._deps[key] === false) {
                return false;
            }
        }

        // everything is done!
        this.signalBootComplete();

    }

    private signalBootComplete() {
        this.booted = true;
        for (let h = 0; h < this._bootCompleteHandlers.length; h++) {
            let handler = this._bootCompleteHandlers[h];
            handler.call(this);
        }
    }

    private ready(handler) {
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

    public async handleTurn(turnContext): Promise<any> {

        debug('INCOMING ACTIVITY:', turnContext.activity);

        // Create a dialog context
        const dialogContext = await this.dialogSet.createContext(turnContext);

        // Spawn a bot worker with the dialogContext
        const bot = await this.spawn(dialogContext).catch((err) => { throw err; });

        // Turn this turnContext into a Botkit message.
        const message = {
            ...turnContext.activity.channelData, // start with all the fields that were in the original incoming payload. TODO: this is a shallow copy, is that a problem?

            // if Botkit has further classified this message, use that sub-type rather than the Activity type
            type: ( turnContext.activity.channelData && turnContext.activity.channelData.botkitEventType ) ? turnContext.activity.channelData.botkitEventType : turnContext.activity.type,

            // normalize the user, text and channel info
            user: turnContext.activity.from.id,
            text: turnContext.activity.text,
            channel: turnContext.activity.conversation.id,

            // generate a conversation reference, for replies. TODO: do we need to this here?
            reference: TurnContext.getConversationReference(turnContext.activity),

            // include the full unmodified record here
            incoming_message: turnContext.activity,
        } as BotkitMessage;

        const interrupt_results = await this.listenForInterrupts(bot, message);

        if (interrupt_results === false) {
            // Continue dialog if one is present
            const dialog_results = await dialogContext.continueDialog();
            if (dialog_results.status === DialogTurnStatus.empty) {
                await this.ingest(bot, message);
            }
        }

        // make sure changes to the state get persisted after the turn is over.
        await this.saveState(bot);
    }

    public async saveState(bot) {
        await this.conversationState.saveChanges(bot._config.context);
    }

    public async ingest(bot: BotWorker, message: BotkitMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            this.middleware.ingest.run(bot, message, async (err, bot, message) => {
                if (err) {
                    reject(err);
                } else {

                    const listen_results = await this.listenForTriggers(bot, message);

                    if (listen_results !== false) {
                        resolve(listen_results);
                    } else {
                        this.middleware.receive.run(bot, message, async (err, bot, message) => {
                            if (err)  { 
                                return reject(err); 
                            }

                            // Trigger event handlers
                            const trigger_results = await this.trigger(message.type, bot, message);

                            resolve(trigger_results);
                        });
                    }
                }
            });
        });
    }

    private async listenForTriggers(bot: BotWorker, message: BotkitMessage): Promise<any> {
        if (this._triggers[message.type]) {
            const triggers = this._triggers[message.type];
            for (var t = 0; t < triggers.length; t++) {
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

    private async listenForInterrupts(bot: BotWorker, message: BotkitMessage): Promise<any> {
        if (this._interrupts[message.type]) {
            const triggers = this._interrupts[message.type];
            for (var t = 0; t < triggers.length; t++) {
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


    private async testTrigger(trigger: any, message: BotkitMessage): Promise<boolean> {
        if (trigger.type === 'string') {
            const test = new RegExp(trigger.pattern,'i');
            if (message.text && message.text.match(test)) {
                return true;
            }
        } else if (trigger.type === 'regexp') {
            const test = trigger.pattern;
            if (message.text && message.text.match(test)) {
                return true;
            }
        } else if (trigger.type === 'function') {
            return await trigger.pattern(message);
        }

        return false;
    }

    /* 
     * hears()
     * instruct your bot to listen for a pattern, and do something when that pattern is heard.
     **/
    public hears(patterns: ( string | RegExp | { (message: BotkitMessage): Promise<boolean> })[] | RegExp | RegExp[] | string | { (message: BotkitMessage): Promise<boolean> }, events: string | string[], handler: (bot: BotWorker, message: BotkitMessage) => Promise<boolean>) {

        if (!Array.isArray(patterns)) {
            patterns = [patterns];
        }

        if (typeof events === 'string') {
            events = events.split(/\,/).map(e => e.trim());
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
                    type: null,
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

    /* 
     * interrupts()
     * instruct your bot to listen for a pattern, and do something when that pattern is heard.
     **/
    public interrupts(patterns: ( string | RegExp | { (message: BotkitMessage): Promise<boolean> })[] | RegExp | RegExp[] | string | { (message: BotkitMessage): Promise<boolean> }, events: string | string[], handler: (bot: BotWorker, message: BotkitMessage) => Promise<boolean>) {

        if (!Array.isArray(patterns)) {
            patterns = [patterns];
        }

        if (typeof events === 'string') {
            events = events.split(/\,/).map(e => e.trim());
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
                    type: null,
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

    /* 
     * on()
     * instruct your bot to respond to certain event types.
     **/
    public on(events: string | string[], handler: (bot: BotWorker, event: any) => Promise<boolean>) {

        if (typeof events === 'string') {
            events = events.split(/\,/).map(e => e.trim());
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
    public async trigger(event: string, bot: BotWorker, message: BotkitMessage): Promise<any> {
        debug('Trigger event: ', event);
        if (this._events[event] && this._events[event].length) {
            for (var h = 0; h < this._events[event].length; h++) {
                const handler_results = await this._events[event][h].call(bot, bot, message);
                if (handler_results === false) {
                    break;
                }
            }
        }
    }

    /* 
     * spawn()
     * spawn a BotWorker to do stuff
     **/
    public spawn(config: any): Promise<BotWorker> {
   
        if (config instanceof TurnContext) {
            config = {
                // TODO: What about a dialog context here?  PROBLEMATIC!
                context: config,
                reference: TurnContext.getConversationReference(config.activity),
                activity: config.activity,
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
        if (this.adapter.botkit_worker) {
            worker = new this.adapter.botkit_worker(this, config);
        } else {
            worker = new BotWorker(this, config);
        }

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

    public loadModule(p: string): void {
        debug('Load Module:',p);
        require(p)(this);
    }

    public loadModules(p: string): void {
        // load all the .js files from this path
        fs.readdirSync(p).filter((f) => { return (path.extname(f) === '.js'); }).forEach((file) => {
            this.loadModule(path.join(p,file));
        });
    }
}