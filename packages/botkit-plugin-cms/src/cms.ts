/**
 * @module botkit-plugin-cms
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Botkit, BotkitDialogWrapper, BotkitMessage, BotWorker, BotkitConversation, BotkitPlugin } from 'botkit';
import * as request from 'request';
import { CmsPluginCore } from './plugin-core';

const url = require('url');
const debug = require('debug')('botkit:cms');

/**
 * A plugin for Botkit that provides access to an instance of [Botkit CMS](https://github.com/howdyai/botkit-cms), including the ability to load script content into a DialogSet
 * and bind before, after and onChange handlers to those dynamically imported dialogs by name.
 *
 * ```javascript
 * controller.use(new BotkitCMSHelper({
 *      uri: process.env.CMS_URI,
 *      token: process.env.CMS_TOKEN
 * }));
 *
 * // use the cms to test remote triggers
 * controller.on('message', async(bot, message) => {
 *   await controller.plugins.cms.testTrigger(bot, message);
 * });
 * ```
 */
export class BotkitCMSHelper extends CmsPluginCore implements BotkitPlugin {
    private _config: any;
    protected _controller: Botkit;

    /**
     * Botkit Plugin name
     */
    public name = 'Botkit CMS';

    public constructor(config: CMSOptions) {
        super();

        this._config = config;
        if (config.controller) {
            this._controller = this._config.controller;
        }

        // for backwards compat, handle these alternate locations
        if (this._config.cms_uri && !this._config.uri) {
            this._config.uri = this._config.cms_uri;
        }
        if (this._config.cms_token && !this._config.token) {
            this._config.token = this._config.cms_token;
        }

        if (!this._config.uri) {
            throw new Error('Specify the root url of your Botkit CMS instance as `uri`');
        }
        if (!this._config.token) {
            throw new Error('Specify a token that matches one configured in your Botkit CMS instance as `token`');
        }
    }

    /**
     * Botkit plugin init function
     * Autoloads all scripts into the controller's main dialogSet.
     * @param botkit A Botkit controller object
     */
    public init(botkit): void {
        this._controller = botkit;
        this._controller.addDep('cms');

        // Extend the controller object with controller.plugins.cms
        botkit.addPluginExtension('cms', this);

        // pre-load all the scripts via the CMS api
        this.loadAllScripts(this._controller).then(() => {
            debug('Dialogs loaded from Botkit CMS');
            this._controller.completeDep('cms');
        }).catch((err) => {
            console.error(`****************************************************************\n${ err }\n****************************************************************`);
        });
    }

    private async apiRequest(uri: string, params: {[key: string]: any} = {}, method = 'GET'): Promise<any> {
        const req = {
            uri: url.resolve(this._config.uri, uri + '?access_token=' + this._config.token),
            headers: {
                'content-type': 'application/json'
            },
            method: method,
            form: params
        };

        debug('Make request to Botkit CMS: ', req);

        return new Promise((resolve, reject) => {
            request(req, function(err, res, body) {
                if (err) {
                    debug('Error in Botkit CMS api: ', err);
                    return reject(err);
                } else {
                    debug('Raw results from Botkit CMS: ', body);
                    if (body === 'Invalid access token') {
                        return reject('Failed to load Botkit CMS content: Invalid access token provided.\nMake sure the token passed into the CMS plugin matches the token set in the CMS .env file.');
                    }
                    let json = null;
                    try {
                        json = JSON.parse(body);
                    } catch (err) {
                        debug('Error parsing JSON from Botkit CMS api: ', err);
                        return reject(err);
                    }

                    if (!json || json == null) {
                        reject(new Error('Botkit CMS API response was empty or invalid JSON'));
                    } else if (json.error) {
                        if (res.statusCode === 401) {
                            console.error(json.error);
                        }
                        reject(json.error);
                    } else {
                        resolve(json);
                    }
                }
            });
        });
    }

    private async getScripts(): Promise<any[]> {
        return this.apiRequest('/api/v1/commands/list');
    }

    private async evaluateTrigger(text: string): Promise<any> {
        return this.apiRequest('/api/v1/commands/triggers', {
            triggers: text
        }, 'POST');
    }

    /**
     * Load all script content from the configured CMS instance into a DialogSet and prepare them to be used.
     * @param botkit The Botkit controller instance
     */
    public async loadAllScripts(botkit: Botkit): Promise<void> {
        const scripts = await this.getScripts();

        scripts.forEach((script) => {
            // map threads from array to object
            const threads = {};
            script.script.forEach((thread) => {
                threads[thread.topic] = thread.script.map(this.mapFields);
            });

            const dialog = new BotkitConversation(script.command, this._controller);
            dialog.script = threads;
            botkit.addDialog(dialog);
        });
    }

    /**
     * Uses the Botkit CMS trigger API to test an incoming message against a list of predefined triggers.
     * If a trigger is matched, the appropriate dialog will begin immediately.
     * @param bot The current bot worker instance
     * @param message An incoming message to be interpreted
     * @returns Returns false if a dialog is NOT triggered, otherwise returns void.
     */
    public async testTrigger(bot: BotWorker, message: Partial<BotkitMessage>): Promise<any> {
        const command = await this.evaluateTrigger(message.text);
        if (command.command) {
            return await bot.beginDialog(command.command);
        }
        return false;
    }
}

export interface CMSOptions {
    uri: string;
    token: string;
    controller?: Botkit;
}
