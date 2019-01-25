import { DialogSet } from 'botbuilder-dialogs';
export declare class BotkitDialogWrapper {
    private dc;
    private step;
    vars: {};
    constructor(dc: any, step: any);
    gotoThread(thread: any): Promise<void>;
}
export declare class BotkitCMSHelper {
    private _cms;
    private _config;
    private _controller;
    constructor(controller: any, config: any);
    loadAllScripts(dialogSet: DialogSet): Promise<void>;
    testTrigger(bot: any, message: any): Promise<any>;
    before(script_name: string, thread_name: string, handler: (convo: any, bot: any) => Promise<void>): void;
    onChange(script_name: string, variable_name: string, handler: (value: any, convo: any, bot: any) => Promise<void>): void;
    after(script_name: string, handler: (results: any, bot: any) => Promise<void>): void;
}
