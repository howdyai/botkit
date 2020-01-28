/**
 * @module botbuilder-adapter-slack
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
  * Create a Slack Dialog object for use with [replyWithDialog()](#replyWithDialog).
  *
  * ```javascript
  * let dialog = new SlackDialog('My Dialog', 'callback_123', 'Save');
  * dialog.addText('Your full name', 'name').addEmail('Your email', 'email');
  * dialog.notifyOnCancel(true);
  * bot.replyWithDialog(message, dialog.asObject());
  * ```
  *
  */
export class SlackDialog {
    private data: any;

    /**
     * Create a new dialog object
     * @param title Title of dialog
     * @param callback_id Callback id of dialog
     * @param submit_label Label for the submit button
     * @param elements An array of dialog elements
     */
    public constructor(title?: string, callback_id?: string, submit_label?: string, elements?: any) {
        this.data = {
            title: title,
            callback_id: callback_id,
            submit_label: submit_label || null,
            elements: elements || []
        };

        return this;
    }

    /**
     * Set the dialog's state field
     * @param v value for state
     */
    public state(v): SlackDialog {
        this.data.state = v;
        return this;
    }

    /**
     * Set true to have Slack notify you with a `dialog_cancellation` event if a user cancels the dialog without submitting
     * @param set True or False
     */
    public notifyOnCancel(set: boolean): SlackDialog {
        this.data.notify_on_cancel = set;
        return this;
    }

    /**
     * Set the title of the dialog
     * @param v Value for title
     */
    public title(v: string): SlackDialog {
        this.data.title = v;
        return this;
    }

    /**
     * Set the dialog's callback_id
     * @param v Value for the callback_id
     */
    public callback_id(v: string): SlackDialog {
        this.data.callback_id = v;
        return this;
    }

    /**
     * Set the button text for the submit button on the dialog
     * @param v Value for the button label
     */
    public submit_label(v: string): SlackDialog {
        this.data.submit_label = v;
        return this;
    }

    /**
     * Add a text input to the dialog
     * @param label
     * @param name
     * @param value
     * @param options
     * @param subtype
     */
    public addText(label: string | any, name: string, value: string, options: string | any, subtype?: string): SlackDialog {
        const element = (typeof (label) === 'object') ? label : {
            label: label,
            name: name,
            value: value,
            type: 'text',
            subtype: subtype || null
        };

        if (typeof (options) === 'object') {
            for (const key in options) {
                element[key] = options[key];
            }
        }

        this.data.elements.push(element);
        return this;
    }

    /**
     * Add an email input to the dialog
     * @param label
     * @param name
     * @param value
     * @param options
     */
    public addEmail(label: string, name: string, value: string, options?: any): SlackDialog {
        return this.addText(label, name, value, options, 'email');
    }

    /**
     * Add a number input to the dialog
     * @param label
     * @param name
     * @param value
     * @param options
     */
    public addNumber(label: string, name: string, value: string, options?: any): SlackDialog {
        return this.addText(label, name, value, options, 'number');
    }

    /**
     * Add a telephone number input to the dialog
     * @param label
     * @param name
     * @param value
     * @param options
     */
    public addTel(label: string, name: string, value: string, options?: any): SlackDialog {
        return this.addText(label, name, value, options, 'tel');
    }

    /**
     * Add a URL input to the dialog
     * @param label
     * @param name
     * @param value
     * @param options
     */
    public addUrl(label: string, name: string, value: string, options?: any): SlackDialog {
        return this.addText(label, name, value, options, 'url');
    }

    /**
     * Add a text area input to the dialog
     * @param label
     * @param name
     * @param value
     * @param options
     * @param subtype
     */
    public addTextarea(label: string, name: string, value: string, options: any, subtype: string): SlackDialog {
        const element = (typeof (label) === 'object') ? label : {
            label: label,
            name: name,
            value: value,
            type: 'textarea',
            subtype: subtype || null
        };

        if (typeof (options) === 'object') {
            for (const key in options) {
                element[key] = options[key];
            }
        }

        this.data.elements.push(element);
        return this;
    }

    /**
     * Add a dropdown select input to the dialog
     * @param label
     * @param name
     * @param value
     * @param option_list
     * @param options
     */
    public addSelect(label: string, name: string, value: string | number | Record<string, any> | null, option_list: { label: string; value: string | number | Record<string, any> | null }[], options?: any): SlackDialog {
        const element = {
            label: label,
            name: name,
            value: value,
            options: option_list,
            type: 'select'
        };
        if (typeof (options) === 'object') {
            for (const key in options) {
                element[key] = options[key];
            }
        }

        this.data.elements.push(element);
        return this;
    }

    /**
     * Get the dialog object as a JSON encoded string.
     */
    public asString(): string {
        return JSON.stringify(this.data, null, 2);
    }

    /**
     * Get the dialog object for use with bot.replyWithDialog()
     */
    public asObject(): any {
        return this.data;
    }
}
