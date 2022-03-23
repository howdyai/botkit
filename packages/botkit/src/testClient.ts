/**
 * @module botkit
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
    Activity,
    AutoSaveStateMiddleware,
    ConversationState,
    MemoryStorage,
    Middleware,
    TestAdapter,
    TurnContext
} from 'botbuilder-core';
import { Dialog, DialogSet, DialogTurnResult, DialogTurnStatus } from 'botbuilder-dialogs';
import { Botkit } from './core';

/**
 * A client for testing dialogs in isolation.
 */
export class BotkitTestClient {
    private readonly _callback: (turnContext: TurnContext) => Promise<void>;
    private readonly _testAdapter: TestAdapter;
    public dialogTurnResult: DialogTurnResult;
    public conversationState: ConversationState;

    /**
     * Create a BotkitTestClient to test a dialog without having to create a full-fledged adapter.
     *
     * ```javascript
     * let client = new BotkitTestClient('test', bot, MY_DIALOG, MY_OPTIONS);
     * let reply = await client.sendActivity('first message');
     * assert.strictEqual(reply.text, 'first reply', 'reply failed');
     * ```
     *
     * @param channelId The channelId to be used for the test.
     * Use 'emulator' or 'test' if you are uncertain of the channel you are targeting.
     * Otherwise, it is recommended that you use the id for the channel(s) your bot will be using and write a test case for each channel.
     * @param bot (Required) The Botkit bot that has the skill to test.
     * @param dialogToTest (Required) The identifier of the skill to test in the bot.
     * @param initialDialogOptions (Optional) additional argument(s) to pass to the dialog being started.
     * @param middlewares (Optional) a stack of middleware to be run when testing
     * @param conversationState (Optional) A ConversationState instance to use in the test client
     */
    public constructor(channelId: string, bot: Botkit, dialogToTest: string | string[], initialDialogOptions?: any, middlewares?: Middleware[], conversationState?: ConversationState)
    public constructor(testAdapter: TestAdapter, bot: Botkit, dialogToTest: string | string[], initialDialogOptions?: any, middlewares?: Middleware[], conversationState?: ConversationState)
    public constructor(channelOrAdapter: string | TestAdapter, bot: Botkit, dialogToTest: string | string[], initialDialogOptions?: any, middlewares?: Middleware[], conversationState?: ConversationState) {
        this.conversationState = conversationState || new ConversationState(new MemoryStorage());

        const dialogState = this.conversationState.createProperty('DialogState');

        let targetDialogs = [];
        if (Array.isArray(dialogToTest)) {
            dialogToTest.forEach((dialogName) => {
                targetDialogs.push(
                    bot.dialogSet.find(dialogName)
                );
                targetDialogs.push(
                    bot.dialogSet.find(dialogName + '_default_prompt')
                );
                targetDialogs.push(
                    bot.dialogSet.find(dialogName + ':botkit-wrapper')
                );
            });
            dialogToTest = dialogToTest[0];
        } else {
            targetDialogs = [
                bot.dialogSet.find(dialogToTest),
                bot.dialogSet.find(dialogToTest + '_default_prompt'),
                bot.dialogSet.find(dialogToTest + ':botkit-wrapper')
            ];
        }

        this._callback = this.getDefaultCallback(targetDialogs, initialDialogOptions || null, dialogState);

        if (typeof channelOrAdapter === 'string') {
            this._testAdapter = new TestAdapter(this._callback, { channelId: channelOrAdapter }).use(new AutoSaveStateMiddleware(this.conversationState));
        } else {
            this._testAdapter = channelOrAdapter;
        }

        this.addUserMiddlewares(middlewares);
    }

    /**
     * Send an activity into the dialog.
     * @returns a TestFlow that can be used to assert replies etc
     * @param activity an activity potentially with text
     *
     * ```javascript
     * DialogTest.send('hello').assertReply('hello yourself').then(done);
     * ```
     */
    public async sendActivity(activity: Partial<Activity> | string): Promise<any> {
        if (!activity) { activity = { type: 'event' }}
        await this._testAdapter.receiveActivity(activity);
        return this._testAdapter.activityBuffer.shift();
    }

    /**
     * Get the next reply waiting to be delivered (if one exists)
     */
    public getNextReply(): Partial<Activity> {
        return this._testAdapter.activityBuffer.shift();
    }

    private getDefaultCallback(targetDialogs: Dialog[], initialDialogOptions: any, dialogState: any): (turnContext: TurnContext) => Promise<void> {
        return async (turnContext: TurnContext): Promise<void> => {
            const dialogSet = new DialogSet(dialogState);
            targetDialogs.forEach(targetDialog => dialogSet.add(targetDialog));
            const dialogContext = await dialogSet.createContext(turnContext);
            this.dialogTurnResult = await dialogContext.continueDialog();
            if (this.dialogTurnResult.status === DialogTurnStatus.empty) {
                this.dialogTurnResult = await dialogContext.beginDialog(targetDialogs[0].id, initialDialogOptions);
            }
        };
    }

    private addUserMiddlewares(middlewares: Middleware[]): void {
        if (middlewares != null) {
            middlewares.forEach((middleware) => {
                this._testAdapter.use(middleware);
            });
        }
    }
}
