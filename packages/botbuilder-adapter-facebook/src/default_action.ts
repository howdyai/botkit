
export class defaultAction{

    private type:string;
    private url:string;
    private webview_height_ratio:string; 

    private constructor(){
        this.type = "web_url";
        this.url = "https://petersfancybrownhats.com/view?item=103";
        this.webview_height_ratio = "tall";
    }

    public static creatDefaultAction(){
        return new defaultAction();
    }

}