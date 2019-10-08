/**
 * @module botkit
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { BotFrameworkAdapter, TurnContext } from 'botbuilder';
import { ConnectorClient, TokenApiClient } from 'botframework-connector';
/**
 * This class extends the [BotFrameworkAdapter](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadapter?view=botbuilder-ts-latest) with a few additional features to support Microsoft Teams.
 * * Changes userAgent to reflect Botkit instead of BotBuilder
 * * Adds getChannels() (MS Teams)
 * * Adds middleware for adjusting location of tenant id field (MS Teams)
 */
export declare class BotkitBotFrameworkAdapter extends BotFrameworkAdapter {
    constructor(options: any);
    /**
     * Allows for mocking of the connector client in unit tests.
     * Overridden by Botkit in order to change userAgent.
     * @ignore
     * @param serviceUrl Clients service url.
     */
    protected createConnectorClient(serviceUrl: string): ConnectorClient;
    /**
     * Allows for mocking of the OAuth API Client in unit tests.
     * Overridden by Botkit in order to change userAgent.
     * @ignore
     * @param serviceUrl Clients service url.
     */
    protected createTokenApiClient(serviceUrl: string): TokenApiClient;
    /**
     * Get the list of channels in a MS Teams team.
     * Can only be called with a TurnContext that originated in a team conversation - 1:1 conversations happen _outside a team_ and thus do not contain the required information to call this API.
     * @param context A TurnContext object representing a message or event from a user in Teams
     * @returns an array of channels in the format [{name: string, id: string}]
     */
    getChannels(context: TurnContext): Promise<{
        id: string;
        name: string;
    }[]>;
}
