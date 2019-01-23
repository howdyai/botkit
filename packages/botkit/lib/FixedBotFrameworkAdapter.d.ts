import { BotFrameworkAdapter, TurnContext, ConversationReference } from 'botbuilder';
export declare class FixedBotFrameworkAdapter extends BotFrameworkAdapter {
    createConversation(reference: Partial<ConversationReference>, logic?: (context: TurnContext) => Promise<void>): Promise<void>;
}
