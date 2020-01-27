/**
 * @module botbuilder-adapter-slack
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActivityTypes, TurnContext, MiddlewareSet } from 'botbuilder';
import { SlackAdapter } from './slack_adapter';

/**
 * A middleware for Botkit developers using the BotBuilder SlackAdapter class.
 * This middleware causes Botkit to emit more specialized events for the different types of message that Slack might send.
 * Responsible for classifying messages:
 *
 *      * `direct_message` events are messages received through 1:1 direct messages with the bot
 *      * `direct_mention` events are messages that start with a mention of the bot, i.e "@mybot hello there"
 *      * `mention` events are messages that include a mention of the bot, but not at the start, i.e "hello there @mybot"
 *
 * In addition, messages from bots and changing them to `bot_message` events. All other types of message encountered remain `message` events.
 *
 * To use this, bind it to the adapter before creating the Botkit controller:
 * ```javascript
 * const adapter = new SlackAdapter(options);
 * adapter.use(new SlackMessageTypeMiddleware());
 * const controller = new Botkit({
 *      adapter: adapter,
 *      // ...
 * });
 * ```
 */
export class SlackMessageTypeMiddleware extends MiddlewareSet {
    /**
     * Not for direct use - implements the MiddlewareSet's required onTurn function used to process the event
     * @param context
     * @param next
     */
    public async onTurn(context: TurnContext, next: () => Promise<any>): Promise<void> {
        if (context.activity.type === 'message' && context.activity.channelData) {
            const adapter = context.adapter as SlackAdapter;

            const bot_user_id = await adapter.getBotUserByTeam(context.activity);
            const mentionSyntax = '<@' + bot_user_id + '(\\|.*?)?>';
            const mention = new RegExp(mentionSyntax, 'i');
            const direct_mention = new RegExp('^' + mentionSyntax, 'i');

            // is this a DM, a mention, or just ambient messages passing through?
            if (context.activity.channelData.type === 'block_actions') {
                context.activity.channelData.botkitEventType = 'block_actions';
            } else if (context.activity.channelData.type === 'interactive_message') {
                context.activity.channelData.botkitEventType = 'interactive_message';
            } else if (context.activity.channelData.channel_type && context.activity.channelData.channel_type === 'im') {
                context.activity.channelData.botkitEventType = 'direct_message';

                // strip any potential leading @mention
                context.activity.text = context.activity.text.replace(direct_mention, '')
                    .replace(/^\s+/, '').replace(/^:\s+/, '').replace(/^\s+/, '');
            } else if (bot_user_id && context.activity.text && context.activity.text.match(direct_mention)) {
                context.activity.channelData.botkitEventType = 'direct_mention';

                // strip the @mention
                context.activity.text = context.activity.text.replace(direct_mention, '')
                    .replace(/^\s+/, '').replace(/^:\s+/, '').replace(/^\s+/, '');
            } else if (bot_user_id && context.activity.text && context.activity.text.match(mention)) {
                context.activity.channelData.botkitEventType = 'mention';
            } else {
                // this is an "ambient" message
            }

            // if this is a message from a bot, we probably want to ignore it.
            // switch the botkit event type to bot_message
            // and the activity type to Event <-- will stop it from being included in dialogs
            // NOTE: This catches any message from any bot, including this bot.
            // Note also, bot_id here is not the same as bot_user_id so we can't (yet) identify messages originating from this bot without doing an additional API call.
            if (context.activity.channelData && context.activity.channelData.bot_id) {
                context.activity.channelData.botkitEventType = 'bot_message';
                context.activity.type = ActivityTypes.Event;
            }
        }
        await next();
    }
}
