export declare class BotkitDialogWrapper {
    private dc;
    private step;
    vars: {};
    constructor(dc: any, step: any);
    gotoThread(thread: any): Promise<void>;
}
export declare class BotkitCMS {
    private _cms;
    private _config;
    private _controller;
    constructor(controller: any, config: any);
    testTrigger(bot: any, message: any): Promise<any>;
    before(script_name: string, thread_name: string, handler: (bot: any, convo: any) => Promise<void>): void;
    onChange(script_name: string, variable_name: string, handler: (bot: any, convo: any, value: any) => Promise<void>): void;
    after(script_name: string, handler: (bot: any, results: any) => Promise<void>): void;
}
