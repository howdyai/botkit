import { Botkit, BotkitDialogWrapper, BotkitConversation, BotkitMessage, BotkitPlugin, BotWorker } from "botkit";

export abstract class CmsPluginCore {
    protected _controller;

    /**
     * Map some less-than-ideal legacy fields to better places
     */
    protected mapFields(line): void {
        // Create the channelData field where any channel-specific stuff goes
        if (!line.channelData) {
            line.channelData = {};
        }

        // TODO: Port over all the other mappings

        // move slack attachments
        if (line.attachments) {
            line.channelData.attachments = line.attachments;
        }

        // we might have a facebook attachment in fb_attachments
        if (line.fb_attachment) {
            const attachment = line.fb_attachment;
            if (attachment.template_type) {
                if (attachment.template_type === 'button') {
                    attachment.text = line.text[0];
                }
                line.channelData.attachment = {
                    type: 'template',
                    payload: attachment
                };
            } else if (attachment.type) {
                line.channelData.attachment = attachment;
            }

            // blank text, not allowed with attachment
            line.text = null;

            // remove blank button array if specified
            if (line.channelData.attachment.payload.elements) {
                for (let e = 0; e < line.channelData.attachment.payload.elements.length; e++) {
                    if (!line.channelData.attachment.payload.elements[e].buttons || !line.channelData.attachment.payload.elements[e].buttons.length) {
                        delete (line.channelData.attachment.payload.elements[e].buttons);
                    }
                }
            }

            delete (line.fb_attachment);
        }

        // Copy quick replies to channelData.
        // This gives support for both "native" quick replies AND facebook quick replies
        if (line.quick_replies) {
            line.channelData.quick_replies = line.quick_replies;
        }

        // handle teams attachments
        if (line.platforms && line.platforms.teams) {
            if (line.platforms.teams.attachments) {
                line.attachments = line.platforms.teams.attachments.map((a) => {
                    a.content = { ...a };
                    a.contentType = 'application/vnd.microsoft.card.' + a.type;
                    return a;
                });
            }
            delete (line.platforms.teams);
        }

        // handle additional custom fields defined in Botkit-CMS
        if (line.meta) {
            for (let a = 0; a < line.meta.length; a++) {
                line.channelData[line.meta[a].key] = line.meta[a].value;
            }
            delete (line.meta);
        }

        return line;
    }

    /**
     * Bind a handler function that will fire before a given script and thread begin.
     * Provides a way to use BotkitConversation.before() on dialogs loaded dynamically via the CMS api instead of being created in code.
     *
     * ```javascript
     * controller.cms.before('my_script','my_thread', async(convo, bot) => {
     *
     *  // do stuff
     *  console.log('starting my_thread as part of my_script');
     *  // other stuff including convo.setVar convo.gotoThread
     *
     * });
     * ```
     *
     * @param script_name The name of the script to bind to
     * @param thread_name The name of a thread within the script to bind to
     * @param handler A handler function in the form async(convo, bot) => {}
     */
    public before(script_name: string, thread_name: string, handler: (convo: BotkitDialogWrapper, bot: BotWorker) => Promise<void>): void {
        const dialog = this._controller.dialogSet.find(script_name) as BotkitConversation;
        if (dialog) {
            dialog.before(thread_name, handler);
        } else {
            throw new Error('Could not find dialog: ' + script_name);
        }
    }

    /**
     * Bind a handler function that will fire when a given variable is set within a a given script.
     * Provides a way to use BotkitConversation.onChange() on dialogs loaded dynamically via the CMS api instead of being created in code.
     *
     * ```javascript
     * controller.plugins.cms.onChange('my_script','my_variable', async(new_value, convo, bot) => {
     *
     * console.log('A new value got set for my_variable inside my_script: ', new_value);
     *
     * });
     * ```
     *
     * @param script_name The name of the script to bind to
     * @param variable_name The name of a variable within the script to bind to
     * @param handler A handler function in the form async(value, convo, bot) => {}
     */
    public onChange(script_name: string, variable_name: string, handler: (value: any, convo: BotkitDialogWrapper, bot: BotWorker) => Promise<void>): void {
        const dialog = this._controller.dialogSet.find(script_name) as BotkitConversation;
        if (dialog) {
            dialog.onChange(variable_name, handler);
        } else {
            throw new Error('Could not find dialog: ' + script_name);
        }
    }

    /**
     * Bind a handler function that will fire after a given dialog ends.
     * Provides a way to use BotkitConversation.after() on dialogs loaded dynamically via the CMS api instead of being created in code.
     *
     * ```javascript
     * controller.plugins.cms.after('my_script', async(results, bot) => {
     *
     * console.log('my_script just ended! here are the results', results);
     *
     * });
     * ```
     *
     * @param script_name The name of the script to bind to
     * @param handler A handler function in the form async(results, bot) => {}
     */
    public after(script_name: string, handler: (results: any, bot: BotWorker) => Promise<void>): void {
        const dialog = this._controller.dialogSet.find(script_name) as BotkitConversation;
        if (dialog) {
            dialog.after(handler);
        } else {
            throw new Error('Could not find dialog: ' + script_name);
        }
    }
}
