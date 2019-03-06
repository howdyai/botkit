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
class SlackEventMiddleware extends botbuilder_1.MiddlewareSet {
    onTurn(context, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (context.activity.type === botbuilder_1.ActivityTypes.Event && context.activity.channelData) {
                // Handle message sub-types
                if (context.activity.channelData.subtype) {
                    context.activity.channelData.botkitEventType = context.activity.channelData.subtype;
                }
                else if (context.activity.channelData.type) {
                    context.activity.channelData.botkitEventType = context.activity.channelData.type;
                }
            }
            yield next();
        });
    }
}
exports.SlackEventMiddleware = SlackEventMiddleware;
//# sourceMappingURL=slackevent_middleware.js.map