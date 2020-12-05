/**
 * 
 */
import {Attachment} from './attachment'

export class Message{

    private text:string;
    private sticker_id:string
    private quick_replies: string;
    private attachment:Attachment;
    
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

}