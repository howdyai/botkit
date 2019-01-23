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
class FixedBotFrameworkAdapter extends botbuilder_1.BotFrameworkAdapter {
    createConversation(reference, logic) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!reference.serviceUrl) {
                throw new Error(`BotFrameworkAdapter.createConversation(): missing serviceUrl.`);
            }
            // Create conversation
            const parameters = { bot: reference.bot, members: [reference.user], channelData: { tenant: { id: reference.tenant } } };
            const client = this.createConnectorClient(reference.serviceUrl);
            // console.log('calling create conversation with', parameters);
            const response = yield client.conversations.createConversation(parameters);
            const fake_activity = {
                type: 'event',
                name: 'createConversation',
            };
            // Initialize request and copy over new conversation ID and updated serviceUrl.
            const request = botbuilder_1.TurnContext.applyConversationReference(fake_activity, reference, true);
            request.conversation = { id: response.id };
            if (response.serviceUrl) {
                request.serviceUrl = response.serviceUrl;
            }
            // console.log('CREATING NEW CONTEXT WITH THIS FAKE ACTIVITY', request);
            // Create context and run middleware
            const context = this.createContext(request);
            yield this.runMiddleware(context, logic);
        });
    }
}
exports.FixedBotFrameworkAdapter = FixedBotFrameworkAdapter;
//# sourceMappingURL=FixedBotFrameworkAdapter.js.map