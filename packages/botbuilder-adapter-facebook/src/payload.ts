/**
 * 
 */

import {Element} from './element'

export class Payload{

    private template_type:string;
    private elements: Array<Element>;
    private static TEMPLATE_DEFAULT = 'generic';

    private constructor(type, elements){
        this.template_type = type;
        this.elements = elements;
    }

    public static createPayload(type, elements){         
        let payload = new Payload(type, elements);
        return payload;
    }

    public static createPayloadFromActivity(activity: any){
        
        console.log('ACTIVITY => ' + JSON.stringify(activity));

        let attachments="";

        if(activity.attachments[0].attachments!=undefined || null){
            attachments = activity.attachments[0].attachments;
        }else{
             attachments = activity.attachments;
        }
        //let attachments = activity.attachments[0].attachments;
        
        if(attachments == undefined || 
            attachments == null)
                throw new Error('attachments not found expected')

        console.log('ACTYIVITIES ON createPayload->')
        console.log(JSON.stringify(attachments));
                
        let cards = new Array<Element>();
        for(let i=0; i<attachments.length; i++){
            let attachent = attachments[i];
            cards.push(
                Element.createElementFromActivity(attachent)
            );
        }

        let payload = this.createPayload(this.TEMPLATE_DEFAULT, cards);
        return payload;
        
    }


}