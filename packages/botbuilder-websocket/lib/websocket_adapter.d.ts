import { BotAdapter } from 'botbuilder';
export declare class WebsocketAdapter extends BotAdapter {
    private _config;
    name: string;
    middlewares: any;
    web: any;
    wss: any;
    private botkit;
    constructor(config: any);
    init(botkit: any): void;
    sendActivities(context: any, activities: any): Promise<any[]>;
    updateActivity(context: any, activity: any): Promise<void>;
    deleteActivity(context: any, reference: any): Promise<void>;
    continueConversation(reference: any, logic: any): any;
    processActivity(req: any, res: any, logic: any): Promise<void>;
}
