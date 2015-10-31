/* This is a module that makes a bot */
/* It expects to receive messages via the bot.receiveMessage function */
/* These messages are expected to match Slack's message format. */
var fs = require('fs');
var mustache = require('mustache');


function Bot(configuration) {

  var bot = {
      events: {}, // this will hold event handlers
      config: {}, // this will hold the configuration
      tasks: [],
      memory: {}, // this will hold instance variables
      taskCount: 0,
      convoCount: 0,
  };

  bot.utterances = {
    yes: new RegExp(/^(yes|yea|yup|ya|sure|ok|y|yeah|yah)/i),
    no: new RegExp(/^(no|nah|nope|n)/i),
  }

  function Conversation(task,message) {

    this.messages = [];
    this.sent = [];
    this.transcript = [];

    this.events = {};

    this.vars = {};

    this.topics = {};
    this.topic = null;

    this.status = 'new';
    this.task = task;
    this.source_message = message;
    this.handler = null;
    this.responses = {};
    this.capture_options = {};
    this.startTime = new Date();
    this.lastActive = new Date();

    this.capture = function(response) {


      var capture_key = this.sent[this.sent.length-1].text;

      if (this.capture_options.key) {
        capture_key = this.capture_options.key;
      }



      if (this.capture_options.multiple) {
        if (!this.responses[capture_key]) {
          this.responses[capture_key] = [];
        }
        this.responses[capture_key].push(response);
      } else {
        this.responses[capture_key] = response;
      }

    }

    this.handle = function(message) {

      this.lastActive = new Date();
      this.transcript.push(message);
      bot.debug('HANDLING MESSAGE IN CONVO',message);
      // do other stuff like call custom callbacks
      if (this.handler) {

        this.capture(message);

        // if the handler is a normal function, just execute it!
        // NOTE: anyone who passes in their own handler has to call
        // convo.next() to continue after completing whatever it is they want to do.
        if (typeof(this.handler)=='function') {
          this.handler(message,this);
        } else {

          // handle might be a mapping of keyword to callback.
          // lets see if the message matches any of the keywords
          var patterns = this.handler;
          for (var p = 0; p < patterns.length; p++) {
            console.log('testing pattern ',patterns[p].pattern);
            if (patterns[p].pattern && message.text.match(patterns[p].pattern)) {
              patterns[p].callback(message,this);
              return;
            }
          }

          // none of the messages matched! What do we do?
          // if a default exists, fire it!
          for (var p = 0; p < patterns.length; p++) {
            if (patterns[p].default) {
              console.log('default pattern ',patterns[p].pattern);
              patterns[p].callback(message,this);
              return;
            }
          }

          // if (this.handler['default']) {
          //   var func = this.handler['default'];
          //   if (typeof(func)=='function') {
          //       func(message,this);
          //   } else {
          //     func.callback(message,this);
          //   }
          //   //this.handler = null;
          //   //console.log(">>>> CLEARED HANDLER");
          // } else {
          //   // if no proper handler exists, THEN WHAT???
          //
          // }


        }
      } else {
  //      console.log(">>>>> DID NOTHING, NO HANDLER");
      }

    }

    this.activate = function() {
      this.status='active';
    }

    this.isActive = function() {
      // active includes both ACTIVE and ENDING
      // in order to allow the timeout end scripts to play out
      return (this.status=='active' || this.status =='ending');
    }

    this.deactivate = function() {
      this.status='inactive';
    }

    this.say = function(message) {
      this.addMessage(message);
    }


    this.on = function(event,cb) {
      bot.debug('Setting up a handler for',event);
      var events = event.split(/\,/g);
      for (var e in events) {
        if (!this.events[events[e]]) {
          this.events[events[e]]=[];
        }
        this.events[events[e]].push(cb);
      }
      return this;
    }

    this.trigger = function(event,data) {
      if (this.events[event]) {
        for (var e = 0; e < this.events[event].length; e++) {
          var res = this.events[event][e].apply(this,data);
          if (res===false) {
            return;
          }
        }
      } else {
        bot.debug('No handler for ',event);
      }
    }

    // proceed to the next message after waiting for an answer
    this.next = function() {
      this.handler = null;
    }

    this.repeat = function() {
      if (this.sent.length) {
       this.messages.push(this.sent[this.sent.length-1]);
      } else {
        // console.log('TRIED TO REPEAT, NOTHING TO SAY');
      }
    }

    this.silentRepeat = function() {

      // do nothing.
      return;

    }

    this.addQuestion = function(message,cb,capture_options,topic) {

        if (typeof(message)=='string') {
          message = {
            text: message,
            channel: this.source_message.channel
          }
        } else {
          message.channel = this.source_message.channel;
        }

        if (capture_options) {
          message.capture_options = capture_options;
        }

        message.handler =cb;
        this.addMessage(message,topic);

    }


    this.ask = function(message,cb,capture_options) {
      this.addQuestion(message,cb,capture_options,this.topic||"default");
    }

    this.addMessage = function(message,topic) {
      if (!topic) {
        topic = this.topic;
      }
      if (typeof(message)=='string') {
        message = {
          text: message,
          channel: this.source_message.channel,
        }
      } else {
        message.channel = this.source_message.channel;
      }

      if (!this.topics[topic]) {
        this.topics[topic] = [];
      }
      this.topics[topic].push(message);

      // this is the current topic, so add it here as well
      if (this.topic==topic) {
        this.messages.push(message);
      }
      //      this.messages.push(message);
    }

    this.changeTopic = function(topic) {
      this.topic = topic;

      if (!this.topics[topic]) {
        this.topics[topic] = [];
      }
      this.messages = this.topics[topic].slice();
      //console.log(">>> CLEAR HANDLER CHANGE TOPIC");
      this.handler = null;
    }

    this.combineMessages = function(messages) {
      if (messages.length>1) {
        var txt = []
        var last_user = null;
        var multi_users = false;
        last_user = messages[0].user;
        for (var x = 0; x < messages.length; x++) {
          if (messages[x].user != last_user) {
            multi_users=true;
          }
        }
        last_user = '';
        for (var x = 0; x < messages.length; x++) {
          if (multi_users && messages[x].user != last_user) {
            last_user = messages[x].user;
            if (txt.length) {
              txt.push("");
            }
            txt.push('<@' + messages[x].user + '>:');
          }
            txt.push(messages[x].text);

        }
        return txt.join("\n");
      } else {
        if (messages.length) {
          return messages[0].text;
        } else {
          return messages.text;
        }
      }

    }

    this.extractResponses = function() {

      var res = {};
      for (var key in this.responses) {
        res[key] = this.extractResponse(key);
      }
      return res;
    }

    this.extractResponse = function(key) {
      return this.combineMessages(this.responses[key]);
    }

    this.replaceTokens = function(text) {

      var vars = {
        identity: this.task.connection.identity,
        responses: this.extractResponses(),
        origin: this.task.source_message,
        vars: this.vars,
      }

      return mustache.render(text,vars);

    }

    this.stop = function(status) {

      //console.log(">>>> CLEAR HANDLER TO STOP");
      this.handler = null;
      this.messages = [];
      this.status=status||'stopped';
      bot.debug('Conversation is over!');
      this.task.conversationEnded(this);

    }

    this.tick = function() {
      var now = new Date();

      if (this.isActive()) {
        if (this.handler) {
          // check timeout!
          // how long since task started?
          var duration = (now.getTime() - this.task.startTime.getTime());
          // how long since last active?
          var lastActive = (now.getTime() - this.lastActive.getTime());

          if (this.task.timeLimit && // has a timelimit
              (duration > this.task.timeLimit) && // timelimit is up
              (lastActive > (60*1000)) // nobody has typed for 60 seconds at least
            ) {

              if (this.topics['timeout']) {
                this.status='ending';
                this.changeTopic('timeout');
              } else {
                this.stop('timeout');
              }
          }
          // otherwise do nothing
        } else {
          if (this.messages.length) {
            if (typeof(this.messages[0].timestamp)=='undefined' || this.messages[0].timestamp <= now.getTime()) {
              var message = this.messages.shift();
              //console.log('HANDLING NEW MESSAGE',message);
              // make sure next message is delayed appropriately
              if (this.messages.length && this.messages[0].delay) {
                this.messages[0].timestamp = now.getTime() + this.messages[0].delay;
              }
              if (message.handler) {
                //console.log(">>>>>> SET HANDLER IN TICK");
                this.handler = message.handler;
              } else {
                this.handler = null;
                //console.log(">>>>>>> CLEARING HANDLER BECAUSE NO HANDLER NEEDED");
              }
              if (message.capture_options) {
                this.capture_options = message.capture_options;
              } else {
                this.capture_options = {};
              }


              this.sent.push(message);
              this.transcript.push(message);
              this.lastActive = new Date();

              if (message.text || message.attachments) {
                message.text = this.replaceTokens(message.text);
                if (this.messages.length && !message.handler) {
                  message.continue_typing = true;
                }

                if (typeof(message.attachments)=='function') {
                  message.attachments = message.attachments(this);
                }

                this.task.bot.say(this.task.connection,message,this);
              }
              if (message.action) {
                console.log('THIS MESSAGE HAS AN ACTION!');
                console.log(message.action);
                  if (message.action=='repeat') {
                    this.repeat();
                  } else if (message.action=='wait') {
                      this.silentRepeat();
                  } else if (message.action=='stop') {
                      this.stop();
                  } else if (message.action=='timeout') {
                        this.stop('timeout');
                  } else if (this.topics[message.action]) {
                    this.changeTopic(message.action);
                  }
              }
            } else {
              //console.log('Waiting to send next message...');
            }

            // end immediately instad of waiting til next tick.
            // if it hasn't already been ended by a message action!
            if (this.isActive() && !this.messages.length && !this.handler) {
              console.log('immediate end');
              this.status='completed';
              bot.debug('Conversation is over!');
              this.task.conversationEnded(this);

            }


          } else if (this.sent.length) { // sent at least 1 message
            console.log('delayed end');
            this.status='completed';
            bot.debug('Conversation is over!');
            this.task.conversationEnded(this);
          }
        }
      }
    }

    bot.debug('CREATED A CONVO FOR',this.source_message.user,this.source_message.channel);
    this.changeTopic('default');

  }

  function Task(message,bot) {

    this.convos = [];
    this.bot = bot;
    this.connection = message._connection;
    this.events = {};
    this.source_message = message;
    this.status = 'active';
    this.startTime = new Date();

    this.isActive = function() {
      return this.status=='active';
    }

    this.startConversation = function(message) {

      var convo = new Conversation(this,message);
      convo.id = bot.convoCount++;

      bot.log('>   [Start] ',convo.id,' Conversation with ',message.user,'in',message.channel);

      convo.activate();
      this.convos.push(convo);
      this.trigger('conversationStarted',[convo]);
      return convo;
    }

    this.conversationEnded = function(convo) {

      bot.log('>   [End] ',convo.id,' Conversation with ',convo.source_message.user,'in',convo.source_message.channel);
      this.trigger('conversationEnded',[convo]);
      convo.trigger('end',[convo]);
      var actives = 0;
      for (var c = 0; c < this.convos.length; c++) {
        if (this.convos[c].isActive()) {
          actives++;
        }
      }
      if (actives==0) {
        this.taskEnded();
      }

    }

    this.taskEnded = function() {

      bot.log('[End] ',this.id,' Task for ',this.source_message.user,'in',this.source_message.channel);

      this.status='completed';
      this.trigger('end',[this]);

    }

    this.on = function(event,cb) {
      bot.debug('Setting up a handler for',event);
      var events = event.split(/\,/g);
      for (var e in events) {
        if (!this.events[events[e]]) {
          this.events[events[e]]=[];
        }
        this.events[events[e]].push(cb);
      }
      return this;
    }

    this.trigger = function(event,data) {
      if (this.events[event]) {
        for (var e = 0; e < this.events[event].length; e++) {
          var res = this.events[event][e].apply(this,data);
          if (res===false) {
            return;
          }
        }
      } else {
        bot.debug('No handler for ',event);
      }
    }


    this.getResponsesByUser = function() {

      var users = {};

      // go through all conversations
      // extract normalized answers
      for (var c = 0; c < this.convos.length; c++) {

          var user = this.convos[c].source_message.user;
          users[this.convos[c].source_message.user] = {};
          var convo = this.convos[c];
          users[user] = convo.extractResponses();
      }

      return users;

    }

    this.getResponsesBySubject = function() {

      var answers = {};

      // go through all conversations
      // extract normalized answers
      for (var c = 0; c < this.convos.length; c++) {
        var convo = this.convos[c];

        for (var key in convo.responses) {
          if (!answers[key]) {
            answers[key] = {};
          }
          answers[key][convo.source_message.user] = convo.extractResponse(key);

        }
      }

      return answers;

    }

    this.tick = function() {

      for (var c = 0; c < this.convos.length; c++) {
        if (this.convos[c].isActive()) {
          this.convos[c].tick();
        }
      }
    }

  }

  bot.debug = function() {
    if (configuration.debug) {
      var args=[];
      for (var k = 0; k < arguments.length; k++) {
        args.push(arguments[k]);
      }
      console.log.apply(null,args);
    }
  }

  bot.log = function() {
      var args=[];
      for (var k = 0; k < arguments.length; k++) {
        args.push(arguments[k]);
      }
      console.log.apply(null,args);
  }


  bot.say = function(message,convo) {
    bot.debug('SAY: ',message);
  }

  bot.replyWithQuestion = function(message,question,cb) {

    bot.startTask(message,function(task,convo) {
      convo.ask(question,cb);
    });

  }

  bot.reply = function(src,resp) {
    bot.debug('REPLY: ',resp);
  }

  bot.hears = function(keywords,events,cb) {
    if (typeof(keywords)=='string') {
      keywords = [keywords];
    }
    if (typeof(events)=='string') {
      events = events.split(/\,/g);
    }

    for (var k = 0; k < keywords.length; k++) {
      var keyword = keywords[k];
      for (var e = 0; e < events.length; e++) {
        (function(keyword) {
          bot.on(events[e],function(message) {
            if (message.text) {
              if (message.text.match(new RegExp(keyword,'i'))) {
                bot.debug("I HEARD ",keyword);
                cb.apply(this,[message]);
                return false;
              }
            } else {
              //console.log('Ignoring message without text',message);
            }
          });
        })(keyword);
      }
    }
  }

  bot.on = function(event,cb) {
    bot.debug('Setting up a handler for',event);
    var events = event.split(/\,/g);
    for (var e in events) {
      if (!this.events[events[e]]) {
        this.events[events[e]]=[];
      }
      this.events[events[e]].push(cb);
    }
    return this;
  }

  bot.trigger = function(event,data) {
    if (this.events[event]) {
      for (var e = 0; e < this.events[event].length; e++) {
        var res = this.events[event][e].apply(this,data);
        if (res===false) {
          return;
        }
      }
    } else {
      bot.debug('No handler for ',event);
    }
  }

  bot.findConversation = function(message,cb) {
    bot.debug('DEFAULT FIND CONVO');
    cb(null);
  }

  bot.startTask = function(message,cb) {

    var task = new Task(message,this);

    task.id = bot.taskCount++;
    bot.log('[Start] ',task.id,' Task for ',message.user,'in',message.channel);

    var convo = task.startConversation(message);

    this.tasks.push(task);

    if (cb) {
      cb(task,convo);
    } else {
      return task;
    }

  }

  bot.receiveMessage = function(message) {

    bot.debug('RECEIVED MESSAGE');

    bot.findConversation(message,function(convo) {
      if (convo) {
        convo.handle(message);
      } else {
        bot.trigger('message_received',[message])
      }
    });
  }

  bot.tick = function() {
    for (var t = 0; t < bot.tasks.length; t++) {
      bot.tasks[t].tick();
    }
    for (var t = bot.tasks.length-1; t >=0; t--) {
      if (!bot.tasks[t].isActive()) {
          bot.tasks.splice(t,1);
      }
    }


    this.trigger('tick',[]);

  }

  bot.init = function() {
    bot.debug('====> BOT BOOTING!');

    bot.config = configuration;

    bot.debug('====> BOT ONLINE!');
    bot.trigger('ready');

  }

  return bot;
}

module.exports = Bot;
