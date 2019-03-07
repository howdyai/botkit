import { ActivityTypes, MiddlewareSet } from 'botbuilder';

export class SlackEventMiddleware extends MiddlewareSet {
    async onTurn(context, next) {
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
