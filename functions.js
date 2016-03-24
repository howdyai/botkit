module.exports = {
	formatUptime: function(uptime){
		var unit = 'seconden';
		if (uptime > 60) {
			uptime = uptime / 60;
			unit = 'minuten';
		}
		if (uptime > 60) {
			uptime = uptime / 60;
			unit = 'uren';
		}
		if (uptime > 24) {
		    uptime = uptime / 24;
		    unit = 'dagen';
		}
		uptime = Math.round(uptime) + ' ' + unit;
		return uptime;
	},
	verifyDate: function(text){
		if (text == "vandaag" || text == "Vandaag"){
			var date = new Date();
		}else if(text == "morgen" || text == "Morgen"){
			var date = new Date();
			date.setDate(date.getDate() + 1);
		}else{
			text = text.replace(/-/g,"/");
			var split = text.split('/');
			if(typeof split[1] != "undefined" && typeof split[2] != "undefined"){
				text = split[1]+'/'+split[0]+'/'+split[2];
			}
			text = text.replace("maa","mar");
			text = text.replace("mei","may");
			text = text.replace("okt","oct");
			var date = new Date(Date.parse(text));
			date.setDate(date.getDate() + 1);
		}
		var current_date = new Date();
		current_date= new Date(Date.parse(current_date.toDateString()));
		if(date != "Invalid Date" && date.getTime()>=current_date.getTime()){
			return date;
		}else{
			return false;
		}
	},
	addSpaces: function(numberOfSpaces){
	var spaces = "";
	for(i=0; i<numberOfSpaces;i++){
		spaces+=" ";
	}
	return spaces;
	},
	verifyUserid: function(input){
		var patern = /<@.{9}>/;
		var userid = patern.exec(input);
		if(userid){
			userid = userid.substr(2,9);
		}
		return userid;
	},
	verifyChannelid:function(input){
		var patern = /<#.{9}>/;
		var channelidid = patern.exec(input);
		if(channelid){
			channelid = channelid.substr(2,9);
		}
		return channelid;
	}
};
