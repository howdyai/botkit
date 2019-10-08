/**
 * @module botkit
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Botkit, BotkitMessage, BotWorker } from '.';
import { BotkitDialogWrapper } from './dialogWrapper';
import { DialogSet } from 'botbuilder-dialogs';
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
export declare class BotkitCMSHelper {
    private _cms;
    private _config;
    private _controller;
    constructor(controller: Botkit, config: any);
    /**
     * Load all script content from the configured CMS instance into a DialogSet and prepare them to be used.
     * @param dialogSet A DialogSet into which the dialogs should be loaded.  In most cases, this is `controller.dialogSet`, allowing Botkit to access these dialogs through `bot.beginDialog()`.
     */
    loadAllScripts(dialogSet: DialogSet): Promise<void>;
    /**
     * Map some less-than-ideal legacy fields to better places
     */
    private mapFields;
    /**
     * Uses the Botkit CMS trigger API to test an incoming message against a list of predefined triggers.
     * If a trigger is matched, the appropriate dialog will begin immediately.
     * @param bot The current bot worker instance
     * @param message An incoming message to be interpretted
     * @returns Returns false if a dialog is NOT triggered, otherwise returns void.
     */
    testTrigger(bot: BotWorker, message: Partial<BotkitMessage>): Promise<any>;
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
    before(script_name: string, thread_name: string, handler: (convo: BotkitDialogWrapper, bot: BotWorker) => Promise<void>): void;
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
    onChange(script_name: string, variable_name: string, handler: (value: any, convo: BotkitDialogWrapper, bot: BotWorker) => Promise<void>): void;
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
    after(script_name: string, handler: (results: any, bot: BotWorker) => Promise<void>): void;
}
