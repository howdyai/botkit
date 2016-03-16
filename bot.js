if (!process.env.token) {
	console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');

var controller = Botkit.slackbot({
	json_file_store: '/media/usb/www/elsje/storage',
	debug: true,
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();

controller.on('channel_joined',function(bot,message) {
	controller.storage.channels.get(message.channel.id, function(err){
		if(err){
			controller.storage.channels.save({id: message.channel.id, tasks:[]});
		}
	});
});

controller.hears(['hello','hi','hoi','hallo','dag','hey'],'direct_message,direct_mention,mention',function(bot, message) {
    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    },function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(',err);
        }
    });
    controller.storage.users.get(message.user,function(err, user) {
        if (user && user.name) {
            bot.reply(message,'Hoi ' + user.name + '!!');
        } else {
            bot.reply(message,'Hoi');
        }
    });
});

controller.hears(['noem me (.*)'],'direct_message,direct_mention,mention',function(bot, message) {
    var matches = message.text.match(/noem me (.*)/i);
    var name = matches[1];
    controller.storage.users.get(message.user,function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user,function(err, id) {
            bot.reply(message,'Prima, vanaf nu zal ik je ' + user.name + ' noemen.');
        });
    });
});

controller.hears(['what is my name','who am i','wie ben ik','hoe heet ik','wat is mijn naam'],'direct_message,direct_mention,mention',function(bot, message) {
    controller.storage.users.get(message.user,function(err, user) {
        if (user && user.name) {
            bot.reply(message,'Jouw naam is ' + user.name);
        } else {
            bot.reply(message,'Ik ken jou nog niet!');
        }
    });
});

controller.hears(['help'],'direct_message,direct_mention',function(bot, message){
	bot.startConversation(message,helpMe);	
});
helpMe = function(response,convo){
	convo.ask('Ik kan helpen met de "takenlijst" en onthouden van "namen"',function(response,convo){
		if(response.text == "Takenlijst" || response.text == "takenlijst"){
			helpWithTakenlijst(response,convo);
		}else if (response.text == "Namen" || response.text == "namen"){
			helpWithNamen(response,convo);
		}else{
			bot.reply(response,"Sorry, daar kan ik je niet mee helpen");
			convo.stop();
		}
	});
}
helpWithTakenlijst = function(response,convo){
	bot.reply(response,'Vraag me om een taak toe te voegen, dan voeg ik het toe aan de takenlijst van het kanaal waar we op dat moment in zitten.\nAls je me om de lijst vraagt, zal ik je deze geven.\nVraag me om een taak af te ronden of af te vinken dan haal ik deze van de lijst af.');
	convo.stop();
}
helpWithNamen = function(response,convo){
	bot.reply(response,"Vertel me hoe ik je moet noemen, dan kan ik die naam in de toekomst gebruiken om te weten wie er bedoeld wordt. (bijv. noem me Elsje.)");
	convo.stop();
}

controller.hears(['shutdown'],'direct_message,direct_mention,mention',function(bot, message) {
	bot.startConversation(message,function(err, convo) {
		convo.ask('Are you sure you want me to shutdown?',[
			{
				pattern: bot.utterances.yes,
				callback: function(response, convo) {
					convo.say('Bye!');
					convo.next();
					setTimeout(function() {
						process.exit();
					},3000);
				}
			},
			{
				pattern: bot.utterances.no,
				default: true,
				callback: function(response, convo) {
					convo.say('*Phew!*');
					convo.next();
				}
			}
		]);
	});
});

controller.hears(['ken ik jou','wie ben jij','hoe lang ben je al wakker','uptime','identify yourself','who are you','what is your name'],'direct_message,direct_mention,mention',function(bot, message) {
	var hostname = os.hostname();
	var uptime = formatUptime(process.uptime());
	bot.reply(message,':robot_face: Ik ben een bot genaamd <@' + bot.identity.name + '>. Ik draai al  ' + uptime + ' op  ' + hostname + '.');
});

function formatUptime(uptime) {
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
}

controller.hears(['takenlijst','lijst'],'mention,direct_mention,ambient',function(bot,message){
		showTaskList(message);	
});
	
controller.hears(['nieuwe taak','voeg toe','taak (.*)voegen'],'direct_mention,mention,direct_message,ambient',function(bot,message){
	bot.startConversation(message,voegTaakToe);
});
voegTaakToe = function(response, convo){
	convo.ask("Wat moet er gedaan worden?",function(response,convo){
		convo.say("Ja, dat moet nodig gebeuren.");
		voorWie(response,convo);
		convo.next();
	});
}
voorWie = function(reponse,convo){
	convo.ask("Wie gaat dit doen? (@naam graag)", function(response,convo){
		var patern = /<@.{9}>/;
		var userid = patern.exec(response.text);
		if(userid !== null){
			response.text = userid[0].substr(2,9);
			convo.say("Ha, gesjaakt!");
			wanneerKlaar(response,convo);
			convo.next();
		}
	});
}
wanneerKlaar = function(response,convo){
	convo.ask("Wanneer moet het klaar zijn?",function(response,convo){
		var datetext = response.text;
if (datetext == "vandaag" || datetext == "Vandaag"){
  var date = new Date();
}else if(datetext == "morgen" || datetext == "Morgen"){
  var date = new Date();
  date.setDate(date.getDate() + 1);
}else{
  datetext = datetext.replace(/-/g,"/");
  var split = datetext.split('/');
  if(typeof split[1] != "undefined" && typeof split[2] != "undefined"){
    datetext = split[1]+'/'+split[0]+'/'+split[2];
  }
  datetext = datetext.replace("maa","mar");
  datetext = datetext.replace("mei","may");
  datetext = datetext.replace("okt","oct");
  var date = new Date(Date.parse(datetext));
  date.setDate(date.getDate() + 1);
}
var current_date = new Date();
current_date= new Date(Date.parse(current_date.toDateString()));
if(date != "Invalid Date" && date.getTime()>=current_date.getTime()){
			response.text = date;
			convo.say("Ik zal het onthouden.");
			if(convo.task.source_message.event=="direct_message"){
				welkKanaal(response,convo);
				convo.next();
			}else{
				opslaanVanTaak(response,convo);
				convo.next();
			}
		}
	});
}
welkKanaal = function(response,convo){
	convo.ask("In welke lijst zal ik dit zetten?",function(response,convo){
		if(true){ //check if input is existing channel
			opslaanVanTaak(response,convo);
			convo.next();
		}
	});
}
opslaanVanTaak = function(response,convo){
	convo.on('end',function(convo){
		if(convo.status=='completed'){
			var res = convo.extractResponses();
			if(res['In welke lijst zal ik dit zetten?']){
					response.channel = res['In welke lijst zal ik dit zetten?'].substr(2,9);
			}
			controller.storage.channels.get(response.channel, function(err, channel_data){
				var list = channel_data;
				bot.api.users.info({"user":res['Wie gaat dit doen? (@naam graag)']},function(err,reply){
					var name = reply.user.name;
					list['tasks'].push({
						taskid: list['tasks'].length+1,
						user: response.user,
						task: res['Wat moet er gedaan worden?'],
						responsible: res['Wie gaat dit doen? (@naam graag)'],
						responsible_name: name,
						deadline: res['Wanneer moet het klaar zijn?'],
						status: "new",
					});
					controller.storage.channels.save({
						id: response.channel,
						tasks: list['tasks'],
					});
				});
			});
			bot.reply(response,"Ok, taak toegevoegd aan de lijst.");
		}else{
			bot.reply(response,"Sorry, ik heb iets niet begrepen, probeer het nog een keer.");
		}
	});
}

showTaskList = function(message){
	controller.storage.channels.get(message.channel,function(err,channel_data){
		var string = "\nTakenlijst van <#"+channel_data.id+">\n```";
		channel_data['tasks'].forEach(function(value,index,array){
			var addtostring ="";
			var deadline = new Date(value.deadline);
			if(value.status != "done"){
				addtostring = 	value.taskid+
						addSpaces(4-value.taskid.toString().length)+
						'<@'+value.responsible+'>'+
						addSpaces(16-value.responsible_name.length)+
						deadline.toUTCString().substr(5,11)+
						addSpaces(4)+
						value.task+
						"\n";
			}
			return string+=addtostring;
		});	
		bot.reply(message,string+"```");
	});

}
addSpaces = function(numberOfSpaces){
	var spaces = "";
	for(i=0; i<numberOfSpaces;i++){
		spaces+=" ";
	}
	return spaces;
}

controller.hears(['taak (.*)afronden','taak (.*)afvinken','ik ben klaar','taak (.*)gedaan'],'direct_mention,mention,ambient,direct_message',function(bot,message){
	if(message.event == "direct_message"){
		bot.reply(message,"Je kan een taak alleen afronden in het kanaal van je taak");
	}else{
		bot.startConversation(message,completeTask);
	}
});
completeTask = function(response,convo){
	showTaskList(convo.source_message);
	convo.ask("Kan je mij het nummer geven van de taak die van de lijst af mag?",function(response,convo){
		if(!isNaN(parseInt(response.text))){
			convo.say("BAM, weer wat gedaan. Goed werk <@"+response.user+">.\n");
			TaskDone(response,convo);
			convo.next();
		}
	});
}
TaskDone = function(response,convo){
	convo.on('end',function(convo){
		if(convo.status=='completed'){
			var res = convo.extractResponses();
			var number = parseInt(res['Kan je mij het nummer geven van de taak die van de lijst af mag?']);
		        controller.storage.channels.get(response.channel, function(err, channel_data){
				channel_data['tasks'].forEach(function(value,index,array){
					if(value.taskid == number){
						value.status = "done";
					}
				});
				controller.storage.channels.save(channel_data);
			});
	        bot.reply(response,"Ok, verwijderd van de lijst.");
		}else{
			bot.reply(response,"Sorry, ik heb iets niet begrepen, probeer het nog een keer.");
		}
	});
}

controller.hears(['sendreminder'],'direct_message',function(bot,message){
	bot.identifyBot(function(err,identity) {
		var botid = identity.id;
		bot.api.users.info({"user":botid},function(err,reply){
			var image = reply.user.profile.image_original;
			bot.api.channels.list({},function(err,response) {
				var channels = response.channels;
				channels.forEach(function(channelinfo){
					controller.storage.channels.get(channelinfo.id,function(err,channel_tasks){
						if(typeof channel_tasks!="undefined"){
							channel_tasks.tasks.forEach(function(task){
								if(task.status=="new"){
									var user = task.responsible;
									bot.api.im.open({user},function(err,response){
										var channel = response.channel.id;
										var deadline = new Date(task.deadline);
										var text = 'Herinnering uit <#'+channelinfo.id+'>: '+task.task+' | deadline: '+deadline.toUTCString().substr(5,11);
										bot.api.chat.postMessage({channel,text,"username":"elsje","icon_url":image});
									});
								}
							});
						}
					});
				});
			});
		});
	});
});
