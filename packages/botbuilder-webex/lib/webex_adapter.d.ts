import { BotAdapter } from 'botbuilder';
export declare class WebexAdapter extends BotAdapter {
    private _config;
    private _api;
    private _identity;
    name: string;
    middlewares: any;
    constructor(config: any);
    init(botkit: any): void;
    resetWebhookSubscriptions(): void;
    registerWebhookSubscription(webhook_path: any): void;
    sendActivities(context: any, activities: any): Promise<any[]>;
    updateActivity(context: any, activity: any): Promise<void>;
    deleteActivity(context: any, reference: any): Promise<void>;
    continueConversation(reference: any, logic: any): any;
    processActivity(req: any, res: any, logic: any): Promise<boolean>;
}
