/*
* 
*/
import * as Debug from 'debug';
import {TYPES} from './TYPES'
import {Message} from './message'
import { MESSAGES_PATH } from 'botbuilder/lib/streaming';
export class MessagesCreator {

	static TEXT = 'TEXT';
	static CARD = 'CARD';
	static CARROUSEL = 'CARROUSEL';


	public static activityToFacebook(activity: any): any{
		
		let type = this.validateTypeMessage(activity);
		console.log('VALIDATE ACTIVITY: ' + JSON.stringify(activity));
		console.log('type: ' + type);
		let message;
		switch(type){
			case TYPES.TEXT:				
				message = Message.createSimpleTextMessage(activity);
			break;
			case TYPES.CARD:
				message = Message.createCardMessage(activity);
			break;
			case TYPES.CARRUSEL:
				message = Message.createCarruselMessageCards(activity);
			break;
		}

		console.log('message created')
		console.log(JSON.stringify(message));
		
		return message;
	}

	private static validateTypeMessage(activity):string{


		if(activity.attachments){
			if(activity.attachmentLayout &&
				activity.attachmentLayout == 'list'){
					return TYPES.CARRUSEL;
			}
			if(activity.attachment.length == 1 &&
				activity.attachmentLayout == undefined){
				return TYPES.CARD;
			}
			
        }else{
			return TYPES.TEXT;
        }

	}

}