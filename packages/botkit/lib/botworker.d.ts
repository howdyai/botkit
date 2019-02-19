import { BotkitMessage } from './core';
import { ConversationReference } from 'botbuilder';
export declare class BotWorker {
    private _controller;
    private _config;
    constructor(controller: any, config: any);
    getConfig(key?: string): any;
    say(message: Partial<BotkitMessage>): Promise<any>;
    reply(src: Partial<BotkitMessage>, resp: Partial<BotkitMessage>): Promise<any>;
    beginDialog(id: any, options: any): Promise<void>;
    changeContext(reference: Partial<ConversationReference>): Promise<BotWorker>;
}
