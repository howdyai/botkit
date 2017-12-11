# BotKit Starter for Cisco Jabber  #
Botkit is designed to ease the process of designing and running useful, creative bots that live inside Cisco Jabber.
Botkit features a comprehensive set of tools to deal with Cisco Jabber, and allows developers to build interactive bots and applications that send and receive messages just like real humans.
This document covers the Cisco Jabber-specific implementation details only.

## Getting Started ##
- Install Botkit
- Ask admin to create a Jabber user for the bot in either Cisco IM&Presence Server (on-premise deployment) or Cisco Webex Messenger (cloud deployment), then get the jid and password from the admin.
Jabber bots can send and receive messages, and in many cases, appear alongside their human counterparts as normal Jabber users.

## Working with Cisco Jabber ##
Cisco Jabber bot uses node-xmpp to connect to Cisco Unified IM & Presence server or Cisco WebEx Messenger and can only use the password authentication methods. The bot is relying on starndard XMPP protocol to send/receive messages. You can refer to [RFC6120](https://tools.ietf.org/html/rfc6120) and [RFC6121](https://tools.ietf.org/html/rfc6121) to learn more about how to connect to XMPP server and how to create the XMPP message stanza. 

Cisco Jabber bot can take part in 1-1 chat or group chat conversations and can provide information or other services for the conversations. It’s better to use persist store for the Botkit controller, otherwise when restart the bot, it will lose the group information and cannot received the message from a group chat.

The full code for a simple Cisco Jabber bot is as below and you can find it in ../examples/jabber_bot.js:

~~~ javascript
    const Botkit = require('./lib/JabberBot.js');
    var controller = Botkit({
    json_file_store: './bot_store/'
    });
    var bot = controller.spawn({
    client: {
        jid: 'xx@domain.com',
        password: *,
        host: "hostname.domain.com",
        port: 5222
        }
    });
    controller.hears(['hello'], ['direct_mention', 'direct_message'], function (bot, message) {
        bot.reply(message, 'Hi');
    });
    controller.on('direct_mention', function (bot, message) {
        bot.reply(message, 'You mentioned me in a group and said, "' + message.text + '"');
    });
    controller.on('direct_message', function (bot, message) {
        bot.reply(message, 'I got your direct message. You said, "' + message.text + '"');
    });
~~~
    
## Bot Options ##
When spawn bot from the Botkit controller, there are several options available.

| Argument | Description
|--- |---
| jid | Jid of the jabber bot 
| password | Password of the jabber bot
| host | Host of the Cisco Unified IM & Presence server, not neccessary for bot of Cisco WebEx Messenger
| port | Port of the Cisco Unified IM & Presence server, not neccessary for bot of Cisco WebEx Messenger

## Jabber Specific Events ##
Jabber support the following events

| Event | Description
|--- |---
| direct_message | Bot has received a direct message from a 1-1 chat
| direct_mention | Bot has received a message from a group chat and is mentioned by the message sender
| self_message | Bot has received a message it sent

## Message Formatting ##
Cisco Jabber bot supports both plain text message and rich text message.
Below is an example for plain text message.
~~~ javascript
    bot.reply(message, 'Hello');
~~~
Below is an example for rich text message.  Jabber Bots Developer needs to compose the whole stanza for the message. He can create his own UI element to replace the UI part inside the body element in this example.
Notes: Below example just for show element clearly. It’s better to remove all empty space in the stanza.

~~~ javascript
    let reply_message = {};
    let to = message.user;
    let type = message.group ? 'groupchat' : 'chat';    
    let body = 'html demo(only for Jabber Windows now)';
    reply_message.text = body;
    reply_message.stanza = xml`<message to="${to}" type="${type}"><body>${body}</body>
    <html xmlns="http://jabber.org/protocol/xhtml-im">
    <body xmlns="http://www.w3.org/1999/xhtml">
    <span style="font-family:Segoe UI;color:#1a1a1a;font-size:10pt;font-weight:normal;font-style:normal;text-decoration:none;">
    <div>	
    <span style="font-family:Comic Sans MS;color:#a61770;font-weight:normal;font-style:normal;text-decoration:none;">${body}
    <form onsubmit="return false;">
    <input type="text" name="mailer"></input>
    <button robot-type="robot-submit" type="button" value="Submit">Submit</button>
    </form>
    </span>
    </div>
    </span>
    </body>
    </html></message>`;
    bot.reply(message, reply_message);
~~~

Cisco Jabber can support all HTML5 elements and bootstrap 3.2 CSS style. However, Bot developer cannot inject any java-script code into the rich text message because of the security reason. In addition, Cisco Jabber introduces a new attribute robot-type for the button element to enhance the interaction between Jabber and the bot.
Below is a short summary of the allow value and description. More detail and example usage can be found in later section.

| Value | Description
|--- |---
| robot-button | Send back a message 
| robot-openlink | Open URL
| robot-executecommand | Execute predefined command in Jabber, like start group chat, start conf call and start instant meeting
| robot-submit | Send back a json message with all input name and value in a HTML form.



- When value is robot-button, when user clicks the button, Jabber will send back a message defined in the attribute robot-message in the same element. Below is an example

~~~ javascript
    let reply_message = {};
	let to = message.user;
	let type = message.group ? 'groupchat' : 'chat';
    let body = 'robot-button demo(only for Jabber Windows)';
    reply_message.text = body;
    reply_message.stanza = xml`<message to="${to}" type="${type}"><body>${body}</body><html xmlns="http://jabber.org/protocol/xhtml-im"><body xmlns="http://www.w3.org/1999/xhtml">
    <div class="container"><h6>${body}</h6><button class="btn btn-primary btn-sm center-block" style="margin-top:8px;" robot-type="robot-button" type="button" robot-message="help">Send back help message</button></div></body></html></message>`;
    bot.reply(message, reply_message);
~~~

All the below buttons needs to be putted in a form.

- When value is robot-openlink, when user clicks the button, cisco jabber will find an element name with openlink in the form, and open URL defined in value of the element name with openlink. Below is an example

~~~ javascript
    let reply_message = {};
    let to = message.user;
    let type = message.group ? 'groupchat' : 'chat';    
    let body = 'robot-openlink demo(only for Jabber Windows)';
    reply_message.text = body;
    reply_message.stanza = xml`<message to="${to}" type="${type}"><body>${body}</body><html xmlns="http://jabber.org/protocol/xhtml-im"><body xmlns="http://www.w3.org/1999/xhtml">
    <div class="container">
    	<h6>${body}</h6>
    	<form class="form-horizontal">
    		<div class="col-sm-offset-2 col-sm-10">
    			<input type="hidden" class="form-control" name="openlink" value="https://help.webex.com/community/jabber"/>
    			<button class="btn btn-primary btn-sm center-block" style="margin-top:8px" robot-type="robot-openlink" type="button">Open Jabber help page</button>
    		</div>
    	</form>
    </div>
    </body></html></message>`;
    bot.reply(message, reply_message);
~~~

- When value is robot-executecommand, when user clicks the button, cisco jabber will find an element name with command in the form, and execute command defined in value of the element name with command.
Jabber provide 3 kinds of command as below examples to start group chat, start an audio/video conference and start an instant Webex meeting.
startgroupchat:john@cisco.com;mick@cisco.com
startconference:john@cisco.com;mick@cisco.com
startmeeting:john@cisco.com;mick@cisco.com
Below is an example, jabber need the jid to execute the related action, generally we can extract the jid from the message received from the user, function extractMentionJids is used to help extract @mention jid from the message.

~~~ javascript
    function extractMentionJids(message) {
    let direct_mention_reg = /href="xmpp:\s?(\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+)\s?"/ig;
    let email_reg = /\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+/i;
    let match = message.stanza.toString().match(direct_mention_reg);
    let mention_jids = [];
    if (match) {
        for (let i = 0; i < match.length; i++) {
            let jid_match = match[i].match(email_reg);
            if (jid_match) {
                let jid = jid_match[0];
                if (jid != bot.client_jid) {
                    mention_jids.push(jid);
                }
             } 
        }
    }
        return mention_jids;
    }
    
    let reply_message = {};
    let to = message.user;
    let type = message.group ? 'groupchat' : 'chat';
    let mention_jids = extractMentionJids(message);
    let mentionJids = "";
    for (let i = 0; i < mention_jids.length; i++) {
        mentionJids += mention_jids[i];
        mentionJids += ";";
    }
    
    let body = 'robot-executecommand demo(only for Jabber Windows)';
    reply_message.text = body;
    reply_message.stanza = xml`<message to="${to}" type="${type}"><body>${body}</body><html xmlns="http://jabber.org/protocol/xhtml-im"><body xmlns="http://www.w3.org/1999/xhtml">
    <div class="container">
    	<h6>${body}</h6>
    	<form class="form-horizontal">
    		<div class="col-sm-offset-2 col-sm-10">
    			<input type="hidden" class="form-control" name="command" value="startgroupchat:${mentionJids}"/>
    			<button class="btn btn-primary btn-sm center-block" style="margin-top:8px" robot-type="robot-executecommand" type="button">Start Group Chat</button>
    		</div>
    	</form>
    </div>
    <div class="container">
    	<form class="form-horizontal">
    		<div class="col-sm-offset-2 col-sm-10">
    			<input type="hidden" class="form-control" name="command" value="startconference:${mentionJids}"/>
    			<button class="btn btn-primary btn-sm center-block" style="margin-top:8px" robot-type="robot-executecommand" type="button">Start Conference</button>
    		</div>
    	</form>
    </div>
    <div class="container">
    	<form class="form-horizontal">
    		<div class="col-sm-offset-2 col-sm-10">
    			<input type="hidden" class="form-control" name="command" value="startmeeting:${mentionJids}"/>
    			<button class="btn btn-primary btn-sm center-block" style="margin-top:8px" robot-type="robot-executecommand" type="button">Start Meeting</button>
    		</div>
    	</form>
    </div>
    </body></html></message>`;
    bot.reply(message, reply_message);
~~~ 


- When value is robot-submit, click the button, cisco jabber will find all element name in the form, and combine all the input into a JSON message and then send it back to the bot.
Below is an example

~~~ javascript
    let reply_message = {};
    let to = message.user;
    let type = message.group ? 'groupchat' : 'chat';
    
    let body = 'robot-submit demo(only for Jabber Windows)';
    reply_message.text = body;
    reply_message.stanza = xml`<message to="${to}" type="${type}"><body>${body}</body><html xmlns="http://jabber.org/protocol/xhtml-im"><body xmlns="http://www.w3.org/1999/xhtml">
    <div class="container">
    	<h5> Please enter the meeting information:</h5>
    	<form class="form-horizontal" onsubmit="return false;">
    		<div class="form-group-sm">
    			<label class="control-label col-sm-2" for="required_attendees">Required Attendees</label>
    			<div class="col-sm-10">
    				<input type="text" class="form-control" id="required_attendees" placeholder="Enter jid of required attendees, like john@cisco.com;mick@cisco.com" name="required_attendees"/>
    			</div>
    		</div>
    		<div class="form-group-sm">
    			<label class="control-label col-sm-2" for="subject">Subject:</label>
    			<div class="col-sm-10">
    				<select class="form-control" id="subject" name="subject">
    					<option>Botkit</option>
    					<option>JabberBot SDK</option>
    					<option>Mindmeld</option>
    				</select>
    			</div>
    		</div>
    		<div class="form-group-sm">
    			<label class="control-label col-sm-2" for="topics">Topics:</label>
    			<div class="col-sm-10">
    				<label class="checkbox-inline">
    					<input type="checkbox" value="Deep Learning" name='topics'/>Deep Learning</label>
    				<label class="checkbox-inline">
    					<input type="checkbox" value="Neural Networks"  name='topics'/>Neural Networks</label>
    				<label class="checkbox-inline">
    					<input type="checkbox" value="Machine Learning" name='topics'/>Machine Learning</label>
    			</div>
    		</div>
    		<div class="form-group-sm">
    			<label class="control-label col-sm-2" for="body">Body:</label>
    			<div class="col-sm-10">
    				<textarea class="form-control" rows="5" placeholder="Enter invitation of this meeting"  id="body" name="body"/>
    			</div>
    		</div>
    		<div class="form-group-sm">
    			<label class="control-label col-sm-2" for="location">Location:</label>
    			<div  class="col-sm-10">
    				<label class="radio-inline">
    					<input type="radio" name="location" value="Great Wall"/>Great Wall</label>
    				<label class="radio-inline">
    					<input type="radio" name="location" value="Big Ben"/>Big Ben</label>
    				<label class="radio-inline">
    					<input type="radio" name="location" value="Grand Canyon"/>Grand Canyon</label>
    			</div>
    		</div>
    		<div class="form-group-sm">
    			<label class="control-label col-sm-2" for="start">Start:</label>
    			<div class="col-sm-10">
    				<input name="start" type="datetime-local" value="2018-01-01T14:00:00"/>
    			</div>
    		</div>
    		<div class="form-group-sm">
    			<label class="control-label col-sm-2" for="end">End:</label>
    			<div class="col-sm-10">
    				<input name="end" type="datetime-local"  value="2018-01-01T13:00:00"/>
    			</div>
    		</div>
    		<div class="form-group-sm">
    			<div class="col-sm-offset-2 col-sm-10">
    				<button class="btn btn-primary btn-sm" style="margin-top:8px"  robot-type="robot-submit" type="button" value="Submit">Submit</button>
    			</div>
    		</div>
    	</form>
    </div>
    </body></html></message>`;
    
    bot.startConversation(message, function (err, convo) {
    if (!err) {
    convo.ask(reply_message, function (response, convo) {
    try {
    if (response.from_jid == bot.client_jid) {
    return;
    }
    let query = JSON.parse(response.text);
    
    let replay_meeting_info = "You submit the following information:";
    replay_meeting_info += "Required Attendees:" + query.required_attendees + ";";
    replay_meeting_info += "Subject:" + query.subject + ";";
    replay_meeting_info += "Body:" + query.body + ";";
    replay_meeting_info += "Topics:" + query.topics + ";";
    replay_meeting_info += "Location:" + query.location + ";";
    replay_meeting_info += "Start:" + query.start + ";";
    replay_meeting_info += "End:" + query.end + "";
    bot.reply(message, replay_meeting_info);
    convo.stop();
    }
    catch (err) {
    console.log(err.message);
    convo.stop();
    }
    });
    }
    });
~~~

## Extensible Messaging and Presence Protocol – API for jabber bot ##
Jabber bot uses node-xmpp to connect to Cisco Unified IM & Presence server or Cisco WebEx Messenger and can only use the password authentication methods. The bot is relying on starndard XMPP protocol to send/receive messages. You can refer to [RFC6120](https://tools.ietf.org/html/rfc6120) and [RFC6121](https://tools.ietf.org/html/rfc6121) to learn more about how to connect to XMPP server and how to create the XMPP message stanza. 
Below is an example for an xmpp message stanza with HTML payload. The bot developer can use this kind of message stanza to implement the functions.

```html
<message
       from='juliet@example.com/balcony'
       id='ktx72v49'
       to='romeo@example.net'
       type='chat'
       xml:lang='en'>
     <body>Art thou not Romeo, and a Montague?</body>
<html xmlns="http://jabber.org/protocol/xhtml-im"> <body xmlns="http://www.w3.org/1999/xhtml">
<div class="container">
<h6>
Art thou not Romeo, and a Montague?
</h6>
</div>
</html> </message>
```
JabberBot uses node-simple-xmpp to build connection and exchange message with Cisco Unified IM & Presence server or Cisco WebEx Messenger.  If you would like to have more functions from XMPP, you can integrate more function into jabber_bot.js with the help of node-simple-xmpp and the underlying node-xmpp like what we have done in the JabberGroupManager.js.  Just handle stanza and underlying events, the bot can have all the functions that a xmpp client can do.



