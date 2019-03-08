/**
 * @module botkit
 */
import { Botkit, BotkitConversation } from '.';
import * as BotkitCMS from 'botkit-studio-sdk';
import { DialogSet } from 'botbuilder-dialogs';
const debug = require('debug')('botkit:cms');

export class BotkitDialogWrapper {

    private dc;
    private step;
    public vars: {};


    constructor(dc, step) {
        this.dc = dc;
        this.step = step;
        this.vars = this.step.values;
    }

    public async gotoThread(thread) {
        this.step.index = 0;
        this.step.thread = thread;
    }

    // TODO: Add other control mechanisms
    // Botkit currently has things convo.repeat, convo.stop, etc
    
}

export class BotkitCMSHelper {

    private _cms: BotkitCMS;
    private _config: any;
    private _controller: Botkit;

    constructor(controller, config) {

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

    async loadAllScripts(dialogSet: DialogSet) {

        var scripts = await this._cms.getScripts();

        scripts.forEach((script)=> {

            // map threads from array to object
            const threads = {};
            script.script.forEach((thread) => {
                threads[thread.topic] = thread.script;
            });

            let d = new BotkitConversation(script.command, this._controller);
            d.script = threads;
            dialogSet.add(d);
        });
    }

    public async testTrigger(bot, message) {
        const command = await this._cms.evaluateTrigger(message.text);
        if (command.command) {
            return await bot.beginDialog(command.command);
        } 
        return false;
    }

    public before(script_name: string, thread_name: string, handler: (convo, bot) => Promise<void>): void {

        let dialog = this._controller.dialogSet.find(script_name) as BotkitConversation;
        if (dialog) {
            dialog.before(thread_name, handler);
        } else {
            throw new Error('Could not find dialog: ' + script_name);
        }

    }

    public onChange(script_name: string, variable_name: string, handler: (value, convo, bot) => Promise<void>) {
        let dialog = this._controller.dialogSet.find(script_name) as BotkitConversation;
        if (dialog) {
            dialog.onChange(variable_name, handler);
        } else {
            throw new Error('Could not find dialog: ' + script_name);
        }
    }

    // NOTE: currently this does not receive a dc, so can't call beginDialog from within an after handler
    public after(script_name: string, handler: (results, bot) => Promise<void>) {
        let dialog = this._controller.dialogSet.find(script_name) as BotkitConversation;
        if (dialog) {
            dialog.after(handler);
        } else {
            throw new Error('Could not find dialog: ' + script_name);
        }
    }

}