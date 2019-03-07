import { BotWorker } from 'botkit';
import { WebClient, Dialog } from '@slack/client';
import * as request from 'request';

export class SlackBotWorker extends BotWorker {
    public api: WebClient;

    constructor(botkit, config) {
        super(botkit, config);

        // TODO: this call is async does this create chaos?
        // make the Slack API available to all bot instances.
        botkit.adapter.getAPI(this.getConfig('activity')).then((api) => {
            this.api = api;
        }).catch((err) => {
            throw err;
        });
    }

    async startPrivateConversation(userId: string): Promise<any> {
        // create the new IM channel
        const channel: any = await this.api.im.open({ user: userId });

        if (channel.ok === true) {
            // now, switch contexts
            return this.changeContext({
                conversation: {
                    id: channel.channel.id,
                    // @ts-ignore this field is required for slack
                    team: this.getConfig('activity').conversation.team
                },
                user: { id: userId, name: null },
                channelId: 'slack'
            });
        } else {
            console.error(channel);
            throw new Error('Error creating IM channel');
        }
    }

    async startConversationInChanne(channelId: string, userId: string): Promise<any> {
        return this.changeContext({
            conversation: {
                id: channelId,
                // @ts-ignore this field is required for slack
                team: this.getConfig('activity').conversation.team
            },
            user: { id: userId, name: null },
            channelId: 'slack'
        });
    }

    async startConversationInThread(channelId: string, userId: string, thread_ts: string): Promise<any> {
        return this.changeContext({
            conversation: {
                id: channelId,
                // @ts-ignore this field is required for slack
                thread_ts: thread_ts,
                team: this.getConfig('activity').conversation.team
            },
            user: { id: userId, name: null },
            channelId: 'slack'
        });
    }

    /* Send a reply to an inbound message, using information collected from that inbound message */
    async replyInThread(src: any, resp: any): Promise<any> {
        // make sure the  thread_ts setting is set
        // this will be included in the conversation reference
        // src.incoming_message.conversation.id = src.incoming_message.conversation.id + '-' + (src.incoming_message.channelData.thread_ts ? src.incoming_message.channelData.thread_ts : src.incoming_message.channelData.ts);
        src.incoming_message.conversation.thread_ts = src.incoming_message.channelData.thread_ts ? src.incoming_message.channelData.thread_ts : src.incoming_message.channelData.ts;
        return this.reply(src, resp);
    }

    /* Send a reply to an inbound message, using information collected from that inbound message */
    async replyEphemeral(src: any, resp: any): Promise<any> {
        // make rure resp is in an object format.
        resp = this.ensureMessageFormat(resp);

        // make sure ephemeral is set
        // fields set in channelData will end up in the final message to slack
        resp.channelData = {
            ...resp.channelData,
            ephemeral: true
        };

        return this.reply(src, resp);
    }

    /* send a public response to a slash command */
    async replyPublic(src: any, resp: any): Promise<any> {
        const msg = this.ensureMessageFormat(resp);
        msg.response_type = 'in_channel';

        return this.replyInteractive(src, msg);
    };

    /* send a private response to a slash command */
    async replyPrivate(src: any, resp: any): Promise<any> {
        const msg = this.ensureMessageFormat(resp);
        msg.response_type = 'ephemeral';
        msg.to = src.user;

        return this.replyInteractive(src, msg);
    };

    async replyInteractive(src: any, resp: any): Promise<any> {
        if (!src.incoming_message.channelData.response_url) {
            throw Error('No response_url found in incoming message');
        } else {
            let msg = this.ensureMessageFormat(resp);

            msg.channel = src.channel;
            msg.to = src.user;

            // if source message is in a thread, reply should also be in the thread
            if (src.incoming_message.channelData.thread_ts) {
                msg.thread_ts = src.incoming_message.channelData.thread_ts;
            }

            var requestOptions = {
                uri: src.incoming_message.channelData.response_url,
                method: 'POST',
                json: msg
            };

            return new Promise(function(resolve, reject) {
                request(requestOptions, function(err, res, body) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(body);
                    }
                });
            });
        }
    };

    async dialogError(errors) {
        if (!errors) {
            errors = [];
        }

        if (Object.prototype.toString.call(errors) !== '[object Array]') {
            errors = [errors];
        }

        this.httpBody(JSON.stringify({ errors }));
    };

    async replyWithDialog(src, dialog_obj: Dialog) {
        var msg = {
            trigger_id: src.trigger_id,
            dialog: dialog_obj
        };

        return this.api.dialog.open(msg);
    };
}
