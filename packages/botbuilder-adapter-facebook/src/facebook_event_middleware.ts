/**
 * @module botbuilder-adapter-facebook
 */
import { MiddlewareSet, ActivityTypes } from 'botbuilder';

/**
 * This adapter middleware, when used in conjunction with FacebookAdapter and Botkit, will result in Botkit emitting events with
 * names based on their event type.
 *
 * ```javascript
 * const adapter = new FacebookAdapter(MY_OPTIONS);
 * adapter.use(new FacebookEventTypeMiddleware());
 * ```
 *
 * When used, events emitted may include:
 * * facebook_postback
 * * facebook_referral
 * * facebook_optin
 * * message_delivered
 * * message_read
 * * facebook_account_linking
 * * message_echo
 * * facebook_app_roles
 * * standby
 * * facebook_receive_thread_control
 * * facebook_request_thread_control
 */
export class FacebookEventTypeMiddleware extends MiddlewareSet {
    /**
     * Implements the middleware's onTurn function. Called automatically!
     * @param context
     * @param next
     */
    public async onTurn(context, next): Promise<void> {
        if (context.activity && context.activity.channelData) {
            let type = null;
            if (context.activity.channelData.postback) {
                type = 'facebook_postback';
            } else if (context.activity.channelData.referral) {
                type = 'facebook_referral';
            } else if (context.activity.channelData.optin) {
                type = 'facebook_optin';
            } else if (context.activity.channelData.delivery) {
                type = 'message_delivered';
            } else if (context.activity.channelData.read) {
                type = 'message_read';
            } else if (context.activity.channelData.account_linking) {
                type = 'facebook_account_linking';
            } else if (context.activity.channelData.message && context.activity.channelData.message.is_echo) {
                type = 'message_echo';
                context.activity.type = ActivityTypes.Event;
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
            }

            context.activity.channelData.botkitEventType = type;
        }

        await next();
    }
}
