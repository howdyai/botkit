/**
 * 
 */
import {Payload} from './payload';
/**
 * Attachment obj message element inside post api facebook
 */
export class Attachment {
	
	private type:string;
	private payload:Payload;
	
	/**
	 * least elements.
	 * uses default template eleement.
	 * @param template
	 * @param payload 
	 */
	private constructor(template, payload){
		this.payload = payload;
		this.type = template || 'template';
	}

	/**
	 * public object to invoke the constructor and avoid access to the constructor
	 * @param template 
	 * @param payload 
	 */

	public static createAttachment(template, payload){

		let attachment = new Attachment(template, payload);
		return attachment;

	}

	public static createAttachmentFromActivity(activity:any): Attachment{
		let payload = Payload.createPayloadFromActivity(activity);
		let attachment = new Attachment('template', payload);

		return attachment;
	}

}