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
class SlackMessageTypeMiddleware extends botbuilder_1.MiddlewareSet {
    onTurn(context, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (context.activity.type === 'message' && context.activity.channelData) {
                // TODO: how will this work in multi-team scenarios?
                const bot_user_id = yield context.adapter.getBotUserByTeam(context.activity);
                var mentionSyntax = '<@' + bot_user_id + '(\\|.*?)?>';
                var mention = new RegExp(mentionSyntax, 'i');
                var direct_mention = new RegExp('^' + mentionSyntax, 'i');
                // is this a DM, a mention, or just ambient messages passing through?
                if (context.activity.channelData.channel_type && context.activity.channelData.channel_type === 'im') {
                    context.activity.channelData.botkitEventType = 'direct_message';
                    // strip any potential leading @mention
                    context.activity.text = context.activity.text.replace(direct_mention, '')
                        .replace(/^\s+/, '').replace(/^\:\s+/, '').replace(/^\s+/, '');
                }
                else if (bot_user_id && context.activity.text && context.activity.text.match(direct_mention)) {
                    context.activity.channelData.botkitEventType = 'direct_mention';
                    // strip the @mention
                    context.activity.text = context.activity.text.replace(direct_mention, '')
                        .replace(/^\s+/, '').replace(/^\:\s+/, '').replace(/^\s+/, '');
                }
                else if (bot_user_id && context.activity.text && context.activity.text.match(mention)) {
                    context.activity.channelData.botkitEventType = 'mention';
                }
                else {
                    // this is an "ambient" message
                }
                // if this is a message from a bot, we probably want to ignore it.
                // switch the botkit event type to bot_message
                // and the activity type to Event <-- will stop it from being included in dialogs
                // NOTE: This catches any message from any bot, including this bot.
                if (context.activity.channelData && context.activity.channelData.bot_id) {
                    context.activity.channelData.botkitEventType = 'bot_message';
                    context.activity.type = botbuilder_1.ActivityTypes.Event;
                }
            }
            yield next();
        });
    }
}
exports.SlackMessageTypeMiddleware = SlackMessageTypeMiddleware;
//# sourceMappingURL=messagetype_middleware.js.map