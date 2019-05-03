/**
 * @module botbuilder-adapter-slack
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActivityTypes, MiddlewareSet, TurnContext } from 'botbuilder';

/**
 * A middleware for Botkit developers using the BotBuilder SlackAdapter class.
 * This middleware causes Botkit to emit message events by their `type` or `subtype` field rather than their default BotBuilder Activity type (limited to message or event).
 * This keeps the new Botkit behavior consistent withprevious versions, and provides helpful filtering on the many event types that Slack sends.
 * To use this, bind it to the adapter before creating the Botkit controller:
 * ```javascript
 * const adapter = new SlackAdapter(options);
 * adapter.use(new SlackEventMiddleware());
 * const controller = new Botkit({
 *      adapter: adapter,
 *      // ...
 * });
 *
 * // can bind directly to channel_join (which starts as a message with type message and subtype channel_join)
 * controller.on('channel_join', async(bot, message) => {
 *  // send a welcome
 * });
 * ```
 */
export class SlackEventMiddleware extends MiddlewareSet {
    /**
     * Not for direct use - implements the MiddlewareSet's required onTurn function used to process the event
     * @param context
     * @param next
     */
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
