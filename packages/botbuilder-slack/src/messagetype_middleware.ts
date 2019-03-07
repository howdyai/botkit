import { ActivityTypes, MiddlewareSet } from 'botbuilder';

export class SlackMessageTypeMiddleware extends MiddlewareSet {
    async onTurn(context, next) {
        if (context.activity.type === 'message' && context.activity.channelData) {
            // TODO: how will this work in multi-team scenarios?
            const bot_user_id = await context.adapter.getBotUserByTeam(context.activity);
            var mentionSyntax = '<@' + bot_user_id + '(\\|.*?)?>';
            var mention = new RegExp(mentionSyntax, 'i');
            var direct_mention = new RegExp('^' + mentionSyntax, 'i');

            // is this a DM, a mention, or just ambient messages passing through?
            if (context.activity.channelData.channel_type && context.activity.channelData.channel_type === 'im') {
                context.activity.channelData.botkitEventType = 'direct_message';

                // strip any potential leading @mention
                context.activity.text = context.activity.text.replace(direct_mention, '')
                    .replace(/^\s+/, '').replace(/^\:\s+/, '').replace(/^\s+/, '');
            } else if (bot_user_id && context.activity.text && context.activity.text.match(direct_mention)) {
                context.activity.channelData.botkitEventType = 'direct_mention';

                // strip the @mention
                context.activity.text = context.activity.text.replace(direct_mention, '')
                    .replace(/^\s+/, '').replace(/^\:\s+/, '').replace(/^\s+/, '');
            } else if (bot_user_id && context.activity.text && context.activity.text.match(mention)) {
                context.activity.channelData.botkitEventType = 'mention';
            } else {
                // this is an "ambient" message
            }

            // if this is a message from a bot, we probably want to ignore it.
            // switch the botkit event type to bot_message
            // and the activity type to Event <-- will stop it from being included in dialogs
            // NOTE: This catches any message from any bot, including this bot.
            if (context.activity.channelData && context.activity.channelData.bot_id) {
                context.activity.channelData.botkitEventType = 'bot_message';
                context.activity.type = ActivityTypes.Event;
            }
        }
        await next();
    }
}
