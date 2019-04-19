/**
 * @module botkit
 */
import { BotFrameworkAdapter, TurnContext } from 'botbuilder';
import * as request from 'request';

/**
 * This class extends the [BotFrameworkAdapter](https://docs.microsoft.com/en-us/javascript/api/botbuilder/botframeworkadapter?view=botbuilder-ts-latest) with a few additional features to support Microsoft Teams.
 */
export class BotkitBotFrameworkAdapter extends BotFrameworkAdapter {

    constructor(options) {
        super(options);

        // Fix a (temporary) issue with transitional location of MS Teams tenantId
        this.use(async(context, next) => {
            if (!context.activity.conversation.tenantId && context.activity.channelData && context.activity.channelData.tenant) {
                context.activity.conversation.tenantId = context.activity.channelData.tenant.id;
            }
            await next();
        });
    }

    /**
     * Get the list of channels in a MS Teams team.
     * Can only be called with a TurnContext that originated in a team conversation - 1:1 conversations happen _outside a team_ and thus do not contain the required information to call this API.
     * @param context A TurnContext object representing a message or event from a user in Teams
     * @returns an array of channels in the format [{name: string, id: string}]
     */
    async getChannels(context: TurnContext) {

        if (context.activity.channelData && context.activity.channelData.team) {

            let token = await this.credentials.getToken(true);

            var uri = context.activity.serviceUrl + 'v3/teams/' + context.activity.channelData.team.id + '/conversations/';
            return new Promise(async (resolve, reject) => {
                request({
                    method: 'GET',
                    headers: {
                        Authorization: 'Bearer ' + token
                    },
                    json: true,
                    uri: uri
                }, async function(err, res, json) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(json.conversations ? json.conversations.map((c) => { if (!c.name) { c.name = 'General' } return c; }) : []);
                    }
                });
            });
        } else {
            console.error('getChannels cannot be called from unknown team')
            return [];
        }

    }

}