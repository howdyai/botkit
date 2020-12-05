/**
 * 
 */
export class QuickReply{

    private content_type: string;
    private title: string;
    private payload: string;
    private image_url: string;

    private constructor(content_type, title, payload){
        this.content_type = content_type;
        this.title = title;
        this.payload = payload;
    }

    public static createQuickReply(content_type, title, payload){
        let quickReply = new QuickReply(
                content_type, 
                title,
                payload);
                
        return quickReply;
    }

    public static getRepliesListFromActivity(activity: any): Array<QuickReply>{

        console.log("== getRepliesListFromActivity == ")
        console.log(JSON.stringify(activity));

        let replies = new Array();

        for(let i=0; i<activity.actions.length; i++){
            let action = activity.actions[i];
            replies.push(
                this.createQuickReplyFromAction(action)
            );
        }

        console.log("== LISTA CREADA == ")
        console.log(JSON.stringify(replies));

        return replies;
    }

    public static createQuickReplyFromAction(action:any):QuickReply{

        return this.createQuickReply(
            'text',
            action.title,
            'postback'
        );

    }

    public setImageUrl(image: string){
        this.image_url = image;
    }


}