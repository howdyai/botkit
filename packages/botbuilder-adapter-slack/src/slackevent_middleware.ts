/**
 * @module botbuilder-adapter-slack
 */
import { ActivityTypes, MiddlewareSet, TurnContext } from 'botbuilder';

export class SlackEventMiddleware extends MiddlewareSet {
    public async onTurn(context: TurnContext, next: () => Promise<any>): Promise<any> {
        if (context.activity.type === ActivityTypes.Event && context.activity.channelData) {
            // Handle message sub-types
            if (context.activity.channelData.subtype) {
                context.activity.channelData.botkitEventType = context.activity.channelData.subtype;
            } else if (context.activity.channelData.type) {
                context.activity.channelData.botkitEventType = context.activity.channelData.type;
            }
        }
        await next();
    }
}
