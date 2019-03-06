import { MiddlewareSet} from 'botbuilder';

export class SlackIdentifyBotsMiddleware extends MiddlewareSet {
    private botIds: { [key: string]: string };

    async onTurn(context, next) {
        // prevent bots from being confused by self-messages.
        // PROBLEM: we don't have our own bot_id!
        // SOLUTION: load it up and compare!
        // TODO: perhaps this should be cached somehow?
        // TODO: error checking on this API call!
        if (context.activity.channelData && context.activity.channelData.bot_id) {
            let botUserId = null;
            if (this.botIds[context.activity.channelData.bot_id]) {
                console.log('GOT CACHED BOT ID');
                botUserId = this.botIds[context.activity.channelData.bot_id]
            } else {
                console.log('LOAD BOT ID');
                const slack = await context.adapter.getAPI(context.activity);
                const bot_info = await slack.bots.info({ bot: context.activity.channelData.bot_id });
                if (bot_info.ok) {
                    this.botIds[context.activity.channelData.bot_id] = bot_info.bot.user_id;
                    botUserId = this.botIds[context.activity.channelData.bot_id]
                }
            }
            
            // if we successfully loaded the bot's identity...
            if (botUserId) {

                console.log('GOT A BOT USER MESSAGE HERE', context.activity);
                console.log('USER ID: ', botUserId);
            }

        }
        // // TODO: getting identity out of adapter is brittle!
        // if (context.activity.from === context.adapter.identity.user_id) {
        //     context.activity.type = 'self_' + context.activity.type;
        // }

        await next();
    }
}
