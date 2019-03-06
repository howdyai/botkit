"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SlackDialog {
    /* helper functions for creating dialog attachments */
    constructor(title, callback_id, submit_label, elements) {
        this.data = {
            title: title,
            callback_id: callback_id,
            submit_label: submit_label || null,
            elements: elements || [],
        };
        return this;
    }
    state(v) {
        this.data.state = v;
        return this;
    }
    notifyOnCancel(set) {
        this.data.notify_on_cancel = set;
        return this;
    }
    title(v) {
        this.data.title = v;
        return this;
    }
    callback_id(v) {
        this.data.callback_id = v;
        return this;
    }
    submit_label(v) {
        this.data.submit_label = v;
        return this;
    }
    addText(label, name, value, options, subtype) {
        var element = (typeof (label) === 'object') ? label : {
            label: label,
            name: name,
            value: value,
            type: 'text',
            subtype: subtype || null,
        };
        if (typeof (options) === 'object') {
            for (var key in options) {
                element[key] = options[key];
            }
        }
        this.data.elements.push(element);
        return this;
    }
    addEmail(label, name, value, options) {
        return this.addText(label, name, value, options, 'email');
    }
    addNumber(label, name, value, options) {
        return this.addText(label, name, value, options, 'number');
    }
    addTel(label, name, value, options) {
        return this.addText(label, name, value, options, 'tel');
    }
    addUrl(label, name, value, options) {
        return this.addText(label, name, value, options, 'url');
    }
    addTextarea(label, name, value, options, subtype) {
        var element = (typeof (label) === 'object') ? label : {
            label: label,
            name: name,
            value: value,
            type: 'textarea',
            subtype: subtype || null,
        };
        if (typeof (options) === 'object') {
            for (var key in options) {
                element[key] = options[key];
            }
        }
        this.data.elements.push(element);
        return this;
    }
    addSelect(label, name, value, option_list, options) {
        var element = {
            label: label,
            name: name,
            value: value,
            options: option_list,
            type: 'select',
        };
        if (typeof (options) === 'object') {
            for (var key in options) {
                element[key] = options[key];
            }
        }
        this.data.elements.push(element);
        return this;
    }
    asString() {
        return JSON.stringify(this.data, null, 2);
    }
    asObject() {
        return this.data;
    }
}
exports.SlackDialog = SlackDialog;
//# sourceMappingURL=slack_dialog.js.map