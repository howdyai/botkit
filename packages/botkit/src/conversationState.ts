import { Activity, ConversationState, Storage, TurnContext } from 'botbuilder';

export class BotkitConversationState extends ConversationState {

    constructor(storage: Storage, namespace?: string) {
        super(storage, namespace);
    }

    // overide the getStorageKey method to create a more complex value
    // this gives Botkit better support for things like multiple users inside a single channel
    // and threads or sub-channels that might exist in a parent channel
    public getStorageKey(context: TurnContext): string | undefined {
        const activity: Activity = context.activity;
        const channelId: string = activity.channelId;
        if (!activity.conversation || !activity.conversation.id) {
            throw new Error('missing activity.conversation');
        }

        // create a combo key by sorting all the fields in the conversation address and combining them all
        const conversationId: string = Object.keys(activity.conversation).sort().map((key) => activity.conversation[key]).filter((val)=>val != '' && val != null && typeof val !== 'undefined').join('-');

        if (!channelId) {
            throw new Error('missing activity.channelId');
        }

        if (!conversationId) {
            throw new Error('missing activity.conversation.id');
        }

        return `${channelId}/conversations/${conversationId}/${ this.namespace }`;
    }


}