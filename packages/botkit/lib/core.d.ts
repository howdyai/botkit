/**
 * @module botkit
 */
import { BotFrameworkAdapter, Storage, ConversationReference } from 'botbuilder';
import { DialogSet } from 'botbuilder-dialogs';
import { BotkitCMSHelper } from './cms';
import { BotkitPluginLoader } from './plugin_loader';
import { BotWorker } from './botworker';
export interface BotkitConfiguration {
    debug?: Boolean;
    webhook_uri?: string;
    adapter?: BotFrameworkAdapter;
    adapterConfig?: {
        [key: string]: any;
    };
    cms?: {
        [key: string]: any;
    };
    webserver?: any;
    storage?: Storage;
    authFunction?: (req: any, res: any, next: any) => void;
}
export interface BotkitMessage {
    type: string;
    text?: string;
    user: string;
    channel: string;
    reference: ConversationReference;
    incoming_message: {
        [key: string]: any;
    };
}
export declare class Botkit {
    private _config;
    private _events;
    private _triggers;
    private _interrupts;
    private conversationState;
    private _deps;
    private _bootCompleteHandlers;
    cms: BotkitCMSHelper;
    version: string;
    middleware: {
        spawn: any;
        ingest: any;
        send: any;
        receive: any;
    };
    storage: Storage;
    webserver: any;
    http: any;
    adapter: any;
    dialogSet: DialogSet;
    plugins: BotkitPluginLoader;
    PATH: string;
    booted: boolean;
    constructor(config: any);
    getConfig(key?: string): any;
    addDep(name: any): void;
    completeDep(name: any): boolean;
    private signalBootComplete;
    private ready;
    private configureWebhookEndpoint;
    handleTurn(turnContext: any): Promise<any>;
    saveState(bot: any): Promise<void>;
    ingest(bot: BotWorker, message: BotkitMessage): Promise<any>;
    private listenForTriggers;
    private listenForInterrupts;
    private testTrigger;
    hears(patterns: (string | RegExp | {
        (message: BotkitMessage): Promise<boolean>;
    })[] | RegExp | RegExp[] | string | {
        (message: BotkitMessage): Promise<boolean>;
    }, events: string | string[], handler: (bot: BotWorker, message: BotkitMessage) => Promise<boolean>): void;
    interrupts(patterns: (string | RegExp | {
        (message: BotkitMessage): Promise<boolean>;
    })[] | RegExp | RegExp[] | string | {
        (message: BotkitMessage): Promise<boolean>;
    }, events: string | string[], handler: (bot: BotWorker, message: BotkitMessage) => Promise<boolean>): void;
    on(events: string | string[], handler: (bot: BotWorker, event: any) => Promise<boolean>): void;
    trigger(event: string, bot: BotWorker, message: BotkitMessage): Promise<any>;
    spawn(config: any): Promise<BotWorker>;
    loadModule(path: string): void;
    loadModules(path: string): void;
}
