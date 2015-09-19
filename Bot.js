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
  };

  bot.utterances = {
    yes: new RegExp(/^(yes|yea|yup|ya|sure|ok)/i),
    no: new RegExp(/^(no|nah|nope)/i),
  }

  function Conversation(task,message) {

    this.messages = [];
    this.sent = [];
    this.transcript = [];


    this.topics = {};
    this.topic = null;

    this.status = 'new';
    this.task = task;
    this.source_message = message;
    this.handler = null;
    this.responses = {};
    this.capture_options = {};

    this.handle = function(message) {
      this.transcript.push(message);
      bot.log('HANDLING MESSAGE IN CONVO',message);
      // do other stuff like call custom callbacks
      if (this.handler) {

        var capture_key = this.sent[this.sent.length-1].text;

        if (this.capture_options.key) {
          capture_key = this.capture_options.key;
        }

        if (this.capture_options.multiple) {
          if (!this.responses[capture_key]) {
            this.responses[capture_key] = [];
          }
          this.responses[capture_key].push(message);
        } else {
          this.responses[capture_key] = message;
        }

        if (typeof(this.handler)=='function') {

          // store the response
          this.handler(message);
          this.handler = null;
        } else {

          // handle might be a mapping of keyword to callback.
          // lets see if the message matches any of the keywords

          for (var keyword in this.handler) {

            // this might be a simple keyword => callback
            // but it might also be keyword => configuration object
            if (typeof(this.handler[keyword])=='function') {
              if (message.text.match(new RegExp(keyword,'i'))) {
                // store the response

                this.handler[keyword](message);
                this.handler = null;
                return;
              }
            } else {
              if (message.text.match(this.handler[keyword].pattern)) {
                this.handler[keyword].callback(message);
                this.handler = null;
                return;
              }
            }
          }

          // none of the messages matched! What do we do?
          // if a default exists, fire it!

          if (this.handler['default']) {
            this.handler['default'](message);
            this.handler = null;
          } else {
            // if no proper handler exists, THEN WHAT???

          }


        }
      }

    }

    this.activate = function() {
      this.status='active';
    }

    this.isActive = function() {
      return this.status=='active';
    }

    this.say = function(message) {
      this.addMessage(message);
    }

    this.repeat = function() {
      if (this.sent.length) {
        this.say(this.sent[this.sent.length-1]);
      } else {
        console.log('TRIED TO REPEAT, NOTHING TO SAY');
      }
    }

    this.silentRepeat = function() {
      if (this.sent.length) {
        var last = {};

        last.text = '';
        last.handler = this.sent[this.sent.length-1].handler;
        last.capture_options = this.sent[this.sent.length-1].capture_options;
        last.action = this.sent[this.sent.length-1].action;

        this.messages.unshift(last);
      } else {
        console.log('TRIED TO REPEAT, NOTHING TO SAY');
      }
    }

    this.addQuestion = function(message,cb,capture_options,topic) {


        console.log('setting up an ask',message,cb,capture_options);
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
          channel: this.source_message.channel
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
        identity: this.task.bot.identity,
        responses: this.extractResponses(),
        origin: this.source_message
      }

      return mustache.render(text,vars);

    }

    this.tick = function() {
      if (this.isActive()) {
        if (this.handler) {
          // check timeout!

          // otherwise do nothing
        } else {
          if (this.messages.length) {
            var message = this.messages.shift();
            if (message.handler) {
              this.handler = message.handler;
            }
            if (message.capture_options) {
              this.capture_options = message.capture_options;
            } else {
              this.capture_options = {};
            }


            this.sent.push(message);
            this.transcript.push(message);
            if (message.text) {
              message.text = this.replaceTokens(message.text);
              this.task.bot.say(this.task.connection,message,this);
            }
            if (message.action) {
                if (message.action=='repeat') {
                  this.repeat();
                } else if (message.action=='wait') {
                    this.silentRepeat();
                } else if (this.topics[message.action]) {
                  this.changeTopic(message.action);
                }
            }

          } else if (this.sent.length) { // sent at least 1 message
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

  function Task(connection,message,bot) {

    this.convos = [];
    this.bot = bot;
    this.connection = connection;
    this.events = {};
    this.source_message = message;
    this.status = 'active';

    this.isActive = function() {
      return this.status=='active';
    }

    this.startConversation = function(message) {

      console.log('Start conversation with ',message);
      var convo = new Conversation(this,message);
      convo.activate();
      this.convos.push(convo);
      this.trigger('conversationStarted',[convo]);
      return convo;
    }

    this.conversationEnded = function(convo) {

      this.trigger('conversationEnded',[convo]);

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

      bot.debug('THIS TASK HAS ENDED!');
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
      console.log('TRIGGER: ' + event);
      if (this.events[event]) {
        for (var e = 0; e < this.events[event].length; e++) {
          var res = this.events[event][e].apply(this,data);
          if (res===false) {
            return;
          }
        }
      } else {
        bot.debug('No handler for ',event,data);
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


  bot.remember = function() {

    if (this.config.path) {
      fs.writeFileSync(this.config.path,JSON.stringify(this.memory));
    } else {
      bot.debug('NOT REMEMBERING! No path set');
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

  bot.hears = function(keywords,event,cb) {
    if (typeof(keywords)=='string') {
      keywords = [keywords];
    }
    var events = event.split(/\,/g);

    for (var k = 0; k < keywords.length; k++) {
      var keyword = keywords[k];
      for (var e = 0; e < events.length; e++) {
        (function(keyword) {
          bot.on(events[e],function(connection,message) {
            console.log('HEARS RESPONDER');
            if (message.text) {
              if (message.text.match(new RegExp(keyword,'i'))) {
                bot.debug("I HEARD ",keyword);
                cb.apply(this,[connection,message]);
                return false;
              }
            } else {
              console.log('Ignoring message without text',message);
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
      bot.debug('No handler for ',event,data);
    }
  }

  bot.findConversation = function(message,cb) {
    bot.debug('DEFAULT FIND CONVO');
    cb(null);
  }

  bot.startTask = function(connection,message,cb) {

    console.log('Start task with',message);
    var task = new Task(connection,message,this);
    var convo = task.startConversation(message);
    this.tasks.push(task);

    if (cb) {
      cb(task,convo);
    } else {
      return task;
    }

  }

  bot.receiveMessage = function(connection,message) {

    bot.debug('RECEIVED MESSAGE');

    bot.findConversation(message,function(convo) {
      if (convo) {
        convo.handle(message);
      } else {
        bot.trigger('message_received',[connection,message])
      }
    });
  }

  bot.tick = function() {
    for (var t = 0; t < bot.tasks.length; t++) {
      bot.tasks[t].tick();
    }
    for (var t = bot.tasks.length-1; t >=0; t--) {
      if (!bot.tasks[t].isActive()) {
        console.log('SPLICE OUT COMPLETED TASK');
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
