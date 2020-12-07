/**
 * 
 */
import {Attachment} from './attachment'
import { QuickReply } from './quickReply';

export class Message{

    private text:string;
    private sticker_id:string
    private attachment:Attachment;
    private quick_replies:Array<QuickReply>;
    
    private constructor(){
    }

    public setText(text:string){
        this.text = text;
    }

    public setAttachment(attachment:Attachment){
        this.attachment = attachment;
    }

    public static createSimpleTextMessage(activity){
        let message = new Message();
        message.setText(activity.text);
        return message;
    }

    public static createCardMessage(activity){

        let message = new Message();
        let attachment = Attachment.createAttachmentFromActivity(activity);       
        message.setAttachment(attachment);

        return message;
    }

    public static createCarruselMessageCards(activity): Message{

        let message = new Message();
        let attachment = Attachment.createAttachmentFromActivity(activity);       
        message.setAttachment(attachment);

        return message;
    }

    public setQuick_replies(replies:Array<QuickReply>):void{

    }

    public static createChoose(activity: any): Message{
        let message = new Message();

        message.setText(activity.text);
        let actions = QuickReply.getRepliesListFromActivity(activity.suggestedActions);
        message.setQuick_replies(actions);

        return message;
    }

}