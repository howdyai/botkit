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
            let threads = {};
            script.script.forEach((thread) => {
                threads[thread.topic] = thread.script.map(this.mapFields)
            });

            let d = new BotkitConversation(script.command, this._controller);
            d.script = threads;
            dialogSet.add(d);
        });

    }

    /**
     * Map some less-than-ideal legacy fields to better places
     */
    private mapFields(line) { 

        // Create the channelData field where any channel-specific stuff goes
        if (!line.channelData) {
            line.channelData = {};
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
                        delete(line.channelData.attachment.payload.elements[e].buttons);
                    }
                }
            }

            delete(line.fb_attachment);
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
                    a.content = {...a};
                    a.contentType = 'application/vnd.microsoft.card.' + a.type;
                    return a;
                });
            }
            delete(line.platforms.teams);
        }

        // handle additional custom fields defined in Botkit-CMS
        if (line.meta) {
            for (var a = 0; a < line.meta.length; a++) {
                line.channelData[line.meta[a].key] = line.meta[a].value;
            }
            delete(line.meta);
        }


        console.log('REMAPPED CMS LINE', line);

        return line;
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