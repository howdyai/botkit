
export class SlackDialog {

    private data: any;

    /* helper functions for creating dialog attachments */
    constructor(title, callback_id, submit_label, elements) {

        this.data = {
            title: title,
            callback_id: callback_id,
            submit_label: submit_label || null,
            elements: elements || [],
        }

        return this;
    }

    public state(v) {
        this.data.state = v;
        return this;
    }

    public notifyOnCancel(set: boolean) {
        this.data.notify_on_cancel = set;
        return this;
    }

    public title(v) {
        this.data.title = v;
        return this;
    }

    public callback_id (v) {
        this.data.callback_id = v;
        return this;
    }
    public submit_label (v) {
        this.data.submit_label = v;
        return this;
    }

    public addText (label, name, value, options, subtype) {
        var element = (typeof(label) === 'object') ? label : {
            label: label,
            name: name,
            value: value,
            type: 'text',
            subtype: subtype || null,
        };

        if (typeof(options) === 'object') {
            for (var key in options) {
                element[key] = options[key];
            }
        }

        this.data.elements.push(element);
        return this;
    }
    
    public addEmail(label, name, value, options) {
        return this.addText(label, name, value, options, 'email');
    }
  
    public addNumber(label, name, value, options) {
        return this.addText(label, name, value, options, 'number');
    }
    
    public addTel(label, name, value, options) {
        return this.addText(label, name, value, options, 'tel');
    }

    public addUrl(label, name, value, options) {
        return this.addText(label, name, value, options, 'url');
    }

    public addTextarea(label, name, value, options, subtype) {

        var element = (typeof(label) === 'object') ? label : {
            label: label,
            name: name,
            value: value,
            type: 'textarea',
            subtype: subtype || null,
        };

        if (typeof(options) === 'object') {
            for (var key in options) {
                element[key] = options[key];
            }
        }

        this.data.elements.push(element);
        return this;
    }

    public addSelect(label, name, value, option_list, options) {
        var element = {
            label: label,
            name: name,
            value: value,
            options: option_list,
            type: 'select',
        };
        if (typeof(options) === 'object') {
            for (var key in options) {
                element[key] = options[key];
            }
        }

        this.data.elements.push(element);
        return this;
    }

    public asString() {
        return JSON.stringify(this.data, null, 2);
    }
    
    public asObject() {
        return this.data;
    }

}