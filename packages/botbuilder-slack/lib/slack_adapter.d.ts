import { Activity, BotAdapter, TurnContext, MiddlewareSet, ConversationReference } from 'botbuilder';
import { WebClient, WebAPICallResult } from '@slack/client';
interface SlackAdapterOptions {
    verificationToken: string;
    botToken?: string;
    getTokenForTeam?: (teamId: string) => string;
    getBotUserByTeam?: (teamId: string) => string;
    clientId?: string;
    clientSecret?: string;
    scopes?: string[];
    redirectUri: string;
}
export declare class SlackAdapter extends BotAdapter {
    private options;
    private slack;
    private identity;
    name: string;
    middlewares: any;
    web: any;
    menu: any;
    private botkit;
    constructor(options: SlackAdapterOptions);
    init(botkit: any): void;
    getAPI(activity: Activity): Promise<WebClient>;
    getBotUserByTeam(activity: Activity): Promise<string>;
    getInstallLink(): string;
    validateOauthCode(code: string): Promise<WebAPICallResult>;
    private activityToSlack;
    sendActivities(context: TurnContext, activities: Activity[]): Promise<any[]>;
    updateActivity(context: TurnContext, activity: Activity): Promise<void>;
    deleteActivity(context: TurnContext, reference: ConversationReference): Promise<void>;
    continueConversation(reference: ConversationReference, logic: (t: TurnContext) => Promise<any>): any;
    processActivity(req: any, res: any, logic: any): Promise<void>;
}
export declare class SlackEventMiddleware extends MiddlewareSet {
    onTurn(context: any, next: any): Promise<void>;
}
export declare class SlackMessageTypeMiddleware extends MiddlewareSet {
    onTurn(context: any, next: any): Promise<void>;
}
export declare class SlackIdentifyBotsMiddleware extends MiddlewareSet {
    private botIds;
    onTurn(context: any, next: any): Promise<void>;
}
export declare class SlackDialog {
    private data;
    constructor(title: any, callback_id: any, submit_label: any, elements: any);
    state(v: any): this;
    notifyOnCancel(set: boolean): this;
    title(v: any): this;
    callback_id(v: any): this;
    submit_label(v: any): this;
    addText(label: any, name: any, value: any, options: any, subtype: any): this;
    addEmail(label: any, name: any, value: any, options: any): this;
    addNumber(label: any, name: any, value: any, options: any): this;
    addTel(label: any, name: any, value: any, options: any): this;
    addUrl(label: any, name: any, value: any, options: any): this;
    addTextarea(label: any, name: any, value: any, options: any, subtype: any): this;
    addSelect(label: any, name: any, value: any, option_list: any, options: any): this;
    asString(): string;
    asObject(): any;
}
export {};
