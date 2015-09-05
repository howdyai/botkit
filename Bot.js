/* This is a module that makes a bot */
/* It expects to receive messages via the bot.receiveMessage function */
/* These messages are expected to match Slack's message format. */
var fs = require('fs');

function Bot(configuration) {

  var bot = {
      events: {}, // this will hold event handlers
      config: {}, // this will hold the configuration
      tasks: [],
      memory: {}, // this will hold instance variables
  };


  function Conversation(task,message) {

    this.messages = [];
    this.sent = [];
    this.status = 'new';
    this.task = task;
    this.source_message = message;
    this.handler = null;
    this.responses = [];

    this.handle = function(message) {
      bot.debug('HANDLING MESSAGE IN CONVO',message);
      // do other stuff like call custom callbacks
      if (this.handler) {

        if (typeof(this.handler)=='function') {
          this.handler(message);
          this.handler = null;
        } else {

          // handle might be a mapping of keyword to callback.
          // lets see if the message matches any of the keywords

          for (var keyword in this.handler) {

            if (message.text.match(new RegExp(keyword,'i'))) {
              this.handler[keyword](message);
              this.handler = null;
              return;
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

    this.ask = function(message,cb) {
      if (typeof(message)=='string') {
        message = {
          text: message,
          channel: this.source_message.channel
        }
      } else {
        message.channel = this.source_message.channel;
      }

      message.handler =cb;

      this.addMessage(message);
    }

    this.addMessage = function(message) {
      if (typeof(message)=='string') {
        message = {
          text: message,
          channel: this.source_message.channel
        }
      } else {
        message.channel = this.source_message.channel;
      }

      this.messages.push(message);
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

            this.sent.push(message);
            this.task.bot.say(this.task.connection,message,this);
          } else {
            this.status='completed';
            bot.debug('Conversation is over!');
            this.task.conversationEnded(this);
          }
        }
      }
    }

    bot.debug('CREATED A CONVO FOR',this.source_message.user,this.source_message.channel);

  }

  function Task(connection,bot) {

    this.convos = [];
    this.bot = bot;
    this.connection = connection;
    this.events = {};

    this.startConversation = function(message) {
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
          bot.on(events[e],function(message) {
            console.log('HEARS RESPONDER');
            if (message.text) {
              if (message.text.match(new RegExp(keyword,'i'))) {
                bot.debug("I HEARD ",keyword);
                cb.apply(this,[message]);
                return false;
              }
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

    var task = new Task(connection,this);
    var convo = task.startConversation(message);
    this.tasks.push(task);

    if (cb) {
      cb(task,convo);
    } else {
      return task;
    }

  }

  bot.receiveMessage = function(connection,message) {

    bot.log('RECEIVED MESSAGE');

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
  }

  bot.init = function() {
    bot.debug('====> BOT BOOTING!');

    bot.config = configuration;

    var json = {};
    if (bot.config.path && fs.existsSync(bot.config.path)) {
        json = fs.readFileSync(bot.config.path,'utf8');
        json = JSON.parse(json);
      } else {
        json = {
          instance: 0,
          users: {},
          channels: {},
        };
    }
    bot.memory = json;
    bot.memory.instance++;
    bot.remember();


    bot.debug('====> BOT ONLINE!');
    bot.trigger('ready');

  }

  return bot;
}

module.exports = Bot;
