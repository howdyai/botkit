/**
 * @module botkit-plugin-cms
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Botkit, BotkitConversation, BotkitMessage, BotkitPlugin, BotWorker } from 'botkit';
import { CmsPluginCore } from './plugin-core';

const debug = require('debug')('botkit:cms-local');

/**
 * A plugin for Botkit that provides access to local scripts in [Botkit CMS](https://github.com/howdyai/botkit-cms) format,
 * including the ability to load script content into a DialogSet and bind before, after and onChange handlers to those dynamically imported dialogs by name.
 *
 * ```javascript
 * const cms = require("botkit-cms")();
 * controller.usePlugin(new BotkitCmsLocalPlugin({
 *      cms,
 *      path: `${__dirname}/scripts.json`,
 *  }));
 *
 * // use the local cms to test dialog triggers
 * controller.on("message", async (bot, message) => {
 *     const results = await controller.plugins.cms.testTrigger(bot, message);
 *     return results === false;
 * });
 * ```
 */
export class BotkitCmsLocalPlugin extends CmsPluginCore implements BotkitPlugin {
    private _config: LocalCmsOptions;
    protected _controller: Botkit;

    public name = 'Botkit CMS local';

    /**
     * Constructor
     * @param config
     */
    public constructor(config: LocalCmsOptions) {
        super();

        this._config = config;

        if (!this._config.path) {
            throw new Error('Scripts paths must be set to use Botkit CMS local plugin.');
        }
        if (!this._config.cms) {
            throw new Error('CMS must be set to use Botkit CMS local plugin.');
        }
    }

    /**
     * Botkit plugin init function
     * @param controller
     */
    public init(controller: Botkit): void {
        this._controller = controller;
        this._controller.addDep('cms');

        controller.addPluginExtension('cms', this);

        this._config.cms.loadScriptsFromFile(this._config.path).then((scripts) => {
            scripts.forEach((script) => {
                // map threads from array to object
                const threads = {};
                script.script.forEach((thread) => {
                    threads[thread.topic] = thread.script.map(this.mapFields);
                });

                const dialog = new BotkitConversation(script.command, this._controller);
                dialog.script = threads;
                this._controller.addDialog(dialog);
            });

            debug('Dialogs loaded from Botkit CMS local file');
            this._controller.completeDep('cms');
        }).catch((err) => {
            console.error('Error loading Botkit CMS local scripts!');
            console.error(`****************************************************************\n${ err }\n****************************************************************`);
        });
    }

    /**
     * Evaluate if the message's text triggers a dialog from the CMS. Returns a promise
     * with the command object if found, or rejects if not found.
     *
     * @param text
     */
    public evaluateTrigger(text: string): Promise<any> {
        return this._config.cms.evaluateTriggers(text);
    };

    /**
     * Uses the Botkit CMS trigger API to test an incoming message against a list of predefined triggers.
     * If a trigger is matched, the appropriate dialog will begin immediately.
     *
     * @param bot The current bot worker instance
     * @param message An incoming message to be interpreted
     * @returns Returns false if a dialog is NOT triggered, otherwise returns void.
     */
    public testTrigger(bot: BotWorker, message: BotkitMessage): Promise<any> {
        debug('Testing Botkit CMS trigger with: ' + message.text);
        return this.evaluateTrigger(message.text).then(function(command) {
            if (command.command) {
                debug('Trigger found, beginning dialog ' + command.command);
                return bot.beginDialog(command.command);
            }
        }).catch(function(error) {
            if (typeof (error) === 'undefined') {
                return false;
            }
            throw error;
        });
    };

    /**
     * Get all scripts, optionally filtering by a tag
     * @param tag
     */
    public getScripts(tag?: string): Promise<any[]> {
        return this._config.cms.getScripts(tag);
    };

    /**
     * Load script from CMS by id
     * @param id
     */
    public async getScriptById(id: string): Promise<any> {
        try {
            return await this._config.cms.getScriptById(id);
        } catch (error) {
            if (typeof (error) === 'undefined') {
                // Script was just not found
                return null;
            }
            throw error;
        }
    };

    /**
     * Load script from CMS by command
     * @param command
     */
    public async getScript(command: string): Promise<any> {
        try {
            return await this._config.cms.getScript(command);
        } catch (error) {
            if (typeof (error) === 'undefined') {
                // Script was just not found
                return null;
            }
            throw error;
        }
    };
}

export interface LocalCmsOptions {
    path: string;
    cms: any;
}
