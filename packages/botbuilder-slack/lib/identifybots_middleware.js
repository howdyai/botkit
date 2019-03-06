"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_1 = require("botbuilder");
class SlackIdentifyBotsMiddleware extends botbuilder_1.MiddlewareSet {
    onTurn(context, next) {
        return __awaiter(this, void 0, void 0, function* () {
            // prevent bots from being confused by self-messages.
            // PROBLEM: we don't have our own bot_id!
            // SOLUTION: load it up and compare!
            // TODO: perhaps this should be cached somehow?
            // TODO: error checking on this API call!
            if (context.activity.channelData && context.activity.channelData.bot_id) {
                let botUserId = null;
                if (this.botIds[context.activity.channelData.bot_id]) {
                    console.log('GOT CACHED BOT ID');
                    botUserId = this.botIds[context.activity.channelData.bot_id];
                }
                else {
                    console.log('LOAD BOT ID');
                    const slack = yield context.adapter.getAPI(context.activity);
                    const bot_info = yield slack.bots.info({ bot: context.activity.channelData.bot_id });
                    if (bot_info.ok) {
                        this.botIds[context.activity.channelData.bot_id] = bot_info.bot.user_id;
                        botUserId = this.botIds[context.activity.channelData.bot_id];
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
            yield next();
        });
    }
}
exports.SlackIdentifyBotsMiddleware = SlackIdentifyBotsMiddleware;
//# sourceMappingURL=identifybots_middleware.js.map