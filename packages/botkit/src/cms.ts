/**
 * @module botkit
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Botkit, BotkitMessage, BotWorker, BotkitConversation } from '.';
import { BotkitDialogWrapper } from './dialogWrapper';
import * as BotkitCMS from 'botkit-studio-sdk';
import { DialogSet } from 'botbuilder-dialogs';
const debug = require('debug')('botkit:cms');

/**
 * Provides access to an instance of Botkit CMS, including the ability to load script content into a DialogSet
 * and bind before, after and onChange handlers to those dynamically imported dialogs by name.
 *
 * ```javascript
 * await controller.cms.loadAllScripts(controller.dialogSet);
 * controller.cms.before('my_script', 'default', async(convo, bot) => {
 *  /// do something before default thread of the my_script runs.
 * });
 *
 * // use the cms to test remote triggers
 * controller.on('message', async(bot, message) => {
 *   await controller.cms.testTrigger(bot, message);
 * });
 * ```
 *
 */
export class BotkitCMSHelper {
    private _cms: BotkitCMS;
    private _config: any;
    private _controller: Botkit;

    public constructor(controller: Botkit, config: any) {
        this._controller = controller;
        this._controller.addDep('cms');

        this._config = config;

        // load the API accessor
        this._cms = new BotkitCMS({
            studio_command_uri: this._config.cms_uri,
            studio_token: this._config.token
        });

        // pre-load all the scripts via the CMS api
        this.loadAllScripts(controller.dialogSet).then(() => {
            debug('Dialogs loaded from Botkit CMS');
            controller.completeDep('cms');
        });
    }

    /**
     * Load all script content from the configured CMS instance into a DialogSet and prepare them to be used.
     * @param dialogSet A DialogSet into which the dialogs should be loaded.  In most cases, this is `controller.dialogSet`, allowing Botkit to access these dialogs through `bot.beginDialog()`.
     */
    public async loadAllScripts(dialogSet: DialogSet): Promise<void> {
        var scripts = await this._cms.getScripts();

        scripts.forEach((script) => {
            // map threads from array to object
            let threads = {};
            script.script.forEach((thread) => {
                threads[thread.topic] = thread.script.map(this.mapFields);
            });

            let d = new BotkitConversation(script.command, this._controller);
            d.script = threads;
            dialogSet.add(d);
        });
    }

    /**
     * Map some less-than-ideal legacy fields to better places
     */
    private mapFields(line): void {
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
            let attachment = line.fb_attachment;
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
                for (var e = 0; e < line.channelData.attachment.payload.elements.length; e++) {
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
            for (var a = 0; a < line.meta.length; a++) {
                line.channelData[line.meta[a].key] = line.meta[a].value;
            }
            delete (line.meta);
        }

        return line;
    }

    /**
     * Uses the Botkit CMS trigger API to test an incoming message against a list of predefined triggers.
     * If a trigger is matched, the appropriate dialog will begin immediately.
     * @param bot The current bot worker instance
     * @param message An incoming message to be interpretted
     * @returns Returns false if a dialog is NOT triggered, otherwise returns void.
     */
    public async testTrigger(bot: BotWorker, message: Partial<BotkitMessage>): Promise<any> {
        const command = await this._cms.evaluateTrigger(message.text);
        if (command.command) {
            return await bot.beginDialog(command.command);
        }
        return false;
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
        let dialog = this._controller.dialogSet.find(script_name) as BotkitConversation;
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
     * controller.cms.onChange('my_script','my_variable', async(new_value, convo, bot) => {
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
        let dialog = this._controller.dialogSet.find(script_name) as BotkitConversation;
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
    * controller.cms.after('my_script', async(results, bot) => {
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
        let dialog = this._controller.dialogSet.find(script_name) as BotkitConversation;
        if (dialog) {
            dialog.after(handler);
        } else {
            throw new Error('Could not find dialog: ' + script_name);
        }
    }
}
