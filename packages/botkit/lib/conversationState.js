"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_1 = require("botbuilder");
class BotkitConversationState extends botbuilder_1.ConversationState {
    constructor(storage, namespace) {
        super(storage, namespace);
    }
    // overide the getStorageKey method to create a more complex value
    // this gives Botkit better support for things like multiple users inside a single channel
    // and threads or sub-channels that might exist in a parent channel
    getStorageKey(context) {
        const activity = context.activity;
        const channelId = activity.channelId;
        if (!activity.conversation || !activity.conversation.id) {
            throw new Error('missing activity.conversation');
        }
        // create a combo key by sorting all the fields in the conversation address and combining them all
        // mix in user id as well, because conversations are between the bot and a single user
        const conversationId = Object.keys(activity.conversation).sort().map((key) => activity.conversation[key]).filter((val) => val != '' && val != null && typeof val !== 'undefined').join('-') + '-' + activity.from.id;
        if (!channelId) {
            throw new Error('missing activity.channelId');
        }
        if (!conversationId) {
            throw new Error('missing activity.conversation.id');
        }
        console.log('CID:', conversationId);
        return `${channelId}/conversations/${conversationId}/${this.namespace}`;
    }
}
exports.BotkitConversationState = BotkitConversationState;
//# sourceMappingURL=conversationState.js.map