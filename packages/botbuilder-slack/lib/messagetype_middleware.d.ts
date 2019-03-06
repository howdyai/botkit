import { MiddlewareSet } from 'botbuilder';
export declare class SlackMessageTypeMiddleware extends MiddlewareSet {
    onTurn(context: any, next: any): Promise<void>;
}
