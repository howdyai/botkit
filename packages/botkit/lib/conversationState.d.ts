import { ConversationState, Storage, TurnContext } from 'botbuilder';
export declare class BotkitConversationState extends ConversationState {
    constructor(storage: Storage, namespace?: string);
    getStorageKey(context: TurnContext): string | undefined;
}
