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
        let replies = new Array();

        for(let i=0; i<activity.actions; i++){
            let action = activity.actions[i];
            replies.push(
                this.createQuickReplyFromAction(action)
            );
        }

        return replies;
    }

    public static createQuickReplyFromAction(action:any):QuickReply{

        return this.createQuickReply(
            'postback',
            action.title,
            action.value
        );

    }

    public setImageUrl(image: string){
        this.image_url = image;
    }


}