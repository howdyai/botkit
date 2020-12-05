/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {Button} from './button'
import {defaultAction} from './default_action';
export class Element {

	private title: string;
	private image_url: string;
	private subtitle: string;
	private buttons: Array<Button>;
	private default_action:defaultAction;

	private constructor(title: string, image_url: string, subtitle: string){
		this.image_url = image_url;
		this.title = title;
		this.subtitle = subtitle;
	}

	public static createElement(title, image_url, subtitle):Element{
		let element = new Element(title, image_url, subtitle);
		element.setDefaultAction();
		return element;
	}

	public setButtons(buttons: Array<Button>){
		this.buttons = buttons;
	}

	public setButtonsFromAny(buttons:any):void{
		this.buttons = buttons;
	}

	public setDefaultAction(){
		this.default_action = defaultAction.creatDefaultAction();
	}

	public static createElementFromActivity(activity:any){

		let element = this.createElement(	
			activity.content.title || '',
			activity.content.images[0].url,
			activity.content.text || '',
		)		
		
		element.setButtonsFromAny(
			this.createButtonsElements(activity.content.buttons)
		);
		
		return element;
	}

	private static createButtonsElements(activityButtons){
		let buttons = new Array();
		if(activityButtons != null &&
			activityButtons != undefined &&
				activityButtons instanceof Array &&
					activityButtons.length > 0){
						buttons = new Array();
						for(let i=0; i<activityButtons.length; i++){
							buttons.push(
								Button.createButtonFromActivityAction(activityButtons[i])
							);
						}

					}
		return buttons;
	}

}