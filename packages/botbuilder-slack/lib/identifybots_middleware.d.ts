import { MiddlewareSet } from 'botbuilder';
export declare class SlackIdentifyBotsMiddleware extends MiddlewareSet {
    private botIds;
    onTurn(context: any, next: any): Promise<void>;
}
