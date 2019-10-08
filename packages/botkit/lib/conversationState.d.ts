/**
 * @module botkit
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ConversationState, TurnContext } from 'botbuilder';
/**
 * A customized version of [ConversationState](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/conversationstate?view=botbuilder-ts-latest) that  overide the [getStorageKey](#getStorageKey) method to create a more complex key value.
 * This allows Botkit to automatically track conversation state in scenarios where multiple users are present in a single channel,
 * or when threads or sub-channels parent channel that would normally collide based on the information defined in the conversation address field.
 * Note: This is used automatically inside Botkit and developers should not need to directly interact with it.
 * @ignore
 */
export declare class BotkitConversationState extends ConversationState {
    getStorageKey(context: TurnContext): string | undefined;
}
