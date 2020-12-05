import { Err } from "typedoc/dist/lib/utils/result";
import {Payload} from './payload'
/**
 * Licensed under the MIT License.
 */	
export class Button {

	private type: string;
	private url: string;
	private title: string;
	private payload:string;


	/**
	 * Constructor with minimal data to implement a button on an action card facebook
	 * @param title 
	 * @param type 
	 */
	public constructor(title, type){
		this.type = type;
		this.title = title;
	}

	/**
	* Manage button object creation using least params 
	* @param title
	* @param type
	*
	*
	**/

	public createButton(title, type){

		return new Button(title, type);

	}

	/**
	*
	* Common buton minimal required  facebooks fields
	*
	**/
	public static createCardButton(title, type, payload):Button{
		let button = new Button(title, type);
		button.setPayload(payload);
		return button;
	}

	/**
	 * create a button from activity object
	 * @param activity 
	 */
	public static createButtonFromActivityAction(activity: any):Button{
		if(activity == null) throw new Error('Object not found');
		let type = 'postback';
		return this.createCardButton(activity.value, type, activity.title)
	}

	public setPayload(payload){
		this.payload = payload;
	}

	public getPayload(){
		return this.payload;
	}

	

}