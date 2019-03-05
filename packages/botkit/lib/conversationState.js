"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_1 = require("botbuilder");
class BotkitConversationState extends botbuilder_1.ConversationState {
    constructor(storage, namespace) {
        super(storage, namespace);
    }
    getStorageKey(context) {
        const activity = context.activity;
        const channelId = activity.channelId;
        // const conversationId: string = activity && activity.conversation && activity.conversation.id ? activity.conversation.id : undefined;
        if (!activity.conversation || !activity.conversation.id) {
            throw new Error('missing activity.conversation');
        }
        // create a combo key by sorting all the fields in the conversation address and combining them all
        const conversationId = Object.keys(activity.conversation).sort().map((key) => activity.conversation[key]).filter((val) => val != '' && val != null && typeof val !== 'undefined').join('-');
        if (!channelId) {
            throw new Error('missing activity.channelId');
        }
        if (!conversationId) {
            throw new Error('missing activity.conversation.id');
        }
        console.log('USING CONVERSATION KEY', conversationId);
        return `${channelId}/conversations/${conversationId}/${this.namespace}`;
    }
}
exports.BotkitConversationState = BotkitConversationState;
//# sourceMappingURL=conversationState.js.map