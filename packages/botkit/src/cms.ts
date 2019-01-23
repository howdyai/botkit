import { BotkitHelper, BotkitDialog } from 'botbuilder-dialogs-botkit-cms';
import { Botkit } from '.';
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

export class BotkitCMS {

    private _cms: BotkitHelper;
    private _config: any;
    private _controller: Botkit;

    constructor(controller, config) {

        this._controller = controller;
        this._controller.addDep('cms');

        this._config = config;

        // load the API accessor
        this._cms = new BotkitHelper(this._config);

        // pre-load all the scripts via the CMS api
        this._cms.loadAllScripts(controller.dialogSet).then(() => {
            debug('Dialogs loaded from Botkit CMS');
            controller.completeDep('cms');
        });

    }

    public async testTrigger(bot, message) {
        return this._cms.testTrigger(bot, message);
    }

    public before(script_name: string, thread_name: string, handler: (bot, convo) => Promise<void>): void {

        let dialog = this._controller.dialogSet.find(script_name) as BotkitDialog;
        dialog.before(thread_name, async (dc, step) => {

            // spawn a bot instance so devs can use API or other stuff as necessary
            const bot = await this._controller.spawn(dc);

            // create a convo controller object
            const convo = new BotkitDialogWrapper(dc, step);

            // finally, call the registered handler.
            handler.call(this, bot, convo);
        });
    }

    public onChange(script_name: string, variable_name: string, handler: (bot, convo, value) => Promise<void>) {
        let dialog = this._controller.dialogSet.find(script_name) as BotkitDialog;
        dialog.onChange(variable_name, async (value, dc, step) => {

            // spawn a bot instance so devs can use API or other stuff as necessary
            const bot = await this._controller.spawn(dc);

            // create a convo controller object
            const convo = new BotkitDialogWrapper(dc, step);

            // finally, call the registered handler.
            handler.call(this,  bot, convo, value);
        });
    }

    // NOTE: currently this does not receive a dc, so can't call beginDialog from within an after handler
    public after(script_name: string, handler: (bot, results) => Promise<void>) {

        let dialog = this._controller.dialogSet.find(script_name) as BotkitDialog;
        dialog.after(async (context, results) => {

            const bot = await this._controller.spawn(context);

            handler.call(this, bot, results);
        });

    }



}