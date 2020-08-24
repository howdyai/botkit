/**
 * @module botkit
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { BotFrameworkAdapter, TurnContext, TeamsInfo, ChannelInfo } from 'botbuilder';
import { ConnectorClient, TokenApiClient } from 'botframework-connector';
import { TeamsBotWorker } from './teamsHelpers';
import * as os from 'os';

const pjson: any = require('../package.json'); // eslint-disable-line @typescript-eslint/no-var-requires

// Retrieve additional information, i.e., host operating system, host OS release, architecture, Node.js version
const ARCHITECTURE: any = os.arch();
const TYPE: any = os.type();
const RELEASE: any = os.release();
const NODE_VERSION: any = process.version;
const USER_AGENT: string = `Microsoft-BotFramework/3.1 Botkit/${ pjson.version } ` +
    `(Node.js,Version=${ NODE_VERSION }; ${ TYPE } ${ RELEASE }; ${ ARCHITECTURE })`;

/**
 * This class extends the [BotFrameworkAdapter](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadapter?view=botbuilder-ts-latest) with a few additional features to support Microsoft Teams.
 * * Changes userAgent to reflect Botkit instead of BotBuilder
 * * Adds getChannels() (MS Teams)
 * * Adds middleware for adjusting location of tenant id field (MS Teams)
 */
export class BotkitBotFrameworkAdapter extends BotFrameworkAdapter {
    public botkit_worker = TeamsBotWorker;

    /**
     * Allows for mocking of the connector client in unit tests.
     * Overridden by Botkit in order to change userAgent.
     * @ignore
     * @param serviceUrl Clients service url.
     */
    public createConnectorClient(serviceUrl: string): ConnectorClient {
        const client: ConnectorClient = new ConnectorClient(this.credentials, { baseUri: serviceUrl, userAgent: USER_AGENT });
        return client;
    }

    /**
     * Allows for mocking of the OAuth API Client in unit tests.
     * Overridden by Botkit in order to change userAgent.
     * @ignore
     * @param serviceUrl Clients service url.
     */
    protected createTokenApiClient(serviceUrl: string): TokenApiClient {
        const client = new TokenApiClient(this.credentials, { baseUri: serviceUrl, userAgent: USER_AGENT });
        return client;
    }

    /**
     * Get the list of channels in a MS Teams team.
     * Can only be called with a TurnContext that originated in a team conversation - 1:1 conversations happen _outside a team_ and thus do not contain the required information to call this API.
     * @param context A TurnContext object representing a message or event from a user in Teams
     * @returns an array of channels in the format [{name: string, id: string}]
     */
    public async getChannels(context: TurnContext): Promise<ChannelInfo[]> {
        if (context.activity.channelData && context.activity.channelData.team) {
            const channels = await TeamsInfo.getTeamChannels(context);
            return channels ? channels.map((c) => { if (!c.name) { c.name = 'General'; } return c; }) : [];
        } else {
            console.error('getChannels cannot be called from unknown team');
            return [];
        }
    }
}
