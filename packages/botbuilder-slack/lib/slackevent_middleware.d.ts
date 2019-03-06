import { MiddlewareSet } from 'botbuilder';
export declare class SlackEventMiddleware extends MiddlewareSet {
    onTurn(context: any, next: any): Promise<void>;
}
