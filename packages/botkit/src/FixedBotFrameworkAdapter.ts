
import {BotFrameworkAdapter, Activity, ConversationAccount, TurnContext, ConversationReference, ConversationParameters } from 'botbuilder';

export class FixedBotFrameworkAdapter extends BotFrameworkAdapter {

    public async createConversation(reference: Partial<ConversationReference>, logic?: (context: TurnContext) => Promise<void>): Promise<void> {
        if (!reference.serviceUrl) { throw new Error(`BotFrameworkAdapter.createConversation(): missing serviceUrl.`); }

        // Create conversation
        const parameters: ConversationParameters = { bot: reference.bot, members: [reference.user],  channelData: { tenant: { id: reference.tenant } }  } as ConversationParameters;
        const client = this.createConnectorClient(reference.serviceUrl);

        // console.log('calling create conversation with', parameters);

        const response = await client.conversations.createConversation(parameters);

        const fake_activity = { 
            type: 'event', 
            name: 'createConversation', 
        };


        // Initialize request and copy over new conversation ID and updated serviceUrl.
        const request: Partial<Activity> = TurnContext.applyConversationReference(
            fake_activity,
            reference,
            true
        );
        request.conversation = { id: response.id } as ConversationAccount;
        if (response.serviceUrl) { request.serviceUrl = response.serviceUrl; }

        // console.log('CREATING NEW CONTEXT WITH THIS FAKE ACTIVITY', request);

        // Create context and run middleware
        const context: TurnContext = this.createContext(request);
        await this.runMiddleware(context, logic as any);
    }

}