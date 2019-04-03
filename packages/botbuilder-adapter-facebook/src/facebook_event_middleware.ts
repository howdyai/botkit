/**
 * @module botbuilder-adapter-facebook
 */
import { ActivityTypes, MiddlewareSet } from 'botbuilder';

export class FacebookEventTypeMiddleware extends MiddlewareSet {
    async onTurn(context, next) {
        if (context.activity && context.activity.channelData) {
            let type = null;
            if (context.activity.channelData.postback) {
                type = 'facebook_postback';
            } else if (context.activity.channelData.referral) {
                type = 'facebook_referral';
            } else if (context.activity.channelData.optin) {
                type = 'facebook_option';
            } else if (context.activity.channelData.delivery) {
                type = 'message_delivered';
            } else if (context.activity.channelData.read) {
                type = 'message_read';
            } else if (context.activity.channelData.account_linking) {
                type = 'facebook_account_linking';
            } else if (context.activity.channelData.message && context.activity.channelData.message.is_echo) {
                type = 'message_echo';
            } else if (context.activity.channelData.app_roles) {
                type = 'facebook_app_roles';
            } else if (context.activity.channelData.standby) {
                type = 'standby';
            } else if (context.activity.channelData.pass_thread_control) {
                type = 'facebook_receive_thread_control';
            } else if (context.activity.channelData.take_thread_control) {
                type = 'facebook_lose_thread_control';
            } else if (context.activity.channelData.request_thread_control) {
                type = 'facebook_request_thread_control';
            } else if (context.activity.channelData.app_roles) {
                type = 'facebook_app_roles';
            }

            context.activity.channelData.botkitEventType = type;
        }

        await next();
    }
}
