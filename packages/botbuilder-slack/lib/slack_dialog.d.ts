export declare class SlackDialog {
    private data;
    constructor(title: any, callback_id: any, submit_label: any, elements: any);
    state(v: any): this;
    notifyOnCancel(set: boolean): this;
    title(v: any): this;
    callback_id(v: any): this;
    submit_label(v: any): this;
    addText(label: any, name: any, value: any, options: any, subtype: any): this;
    addEmail(label: any, name: any, value: any, options: any): this;
    addNumber(label: any, name: any, value: any, options: any): this;
    addTel(label: any, name: any, value: any, options: any): this;
    addUrl(label: any, name: any, value: any, options: any): this;
    addTextarea(label: any, name: any, value: any, options: any, subtype: any): this;
    addSelect(label: any, name: any, value: any, option_list: any, options: any): this;
    asString(): string;
    asObject(): any;
}
