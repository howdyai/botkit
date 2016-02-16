/**
 * This is a module that makes a bot
 * It expects to receive messages via the botkit.receiveMessage function
 * These messages are expected to match Slack's message format.
 **/
var mustache = require('mustache');
var simple_storage = require(__dirname + '/storage/simple_storage.js');
var ConsoleLogger = require(__dirname + '/console_logger.js');
var LogLevels = ConsoleLogger.LogLevels;

function Botkit(configuration) {
    var botkit = {
        events: {}, // this will hold event handlers
        config: {}, // this will hold the configuration
        tasks: [],
        taskCount: 0,
        convoCount: 0,
        memory_store: {
            users: {},
            channels: {},
            teams: {},
        }
    };

    botkit.utterances = {
        yes: new RegExp(/^(yes|yea|yup|yep|ya|sure|ok|y|yeah|yah)/i),
        no: new RegExp(/^(no|nah|nope|n)/i),
    };

    function Conversation(task, message) {

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
            var capture_key = this.sent[this.sent.length - 1].text;

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

        };

        this.handle = function(message) {

            this.lastActive = new Date();
            this.transcript.push(message);
            botkit.debug('HANDLING MESSAGE IN CONVO', message);
            // do other stuff like call custom callbacks
            if (this.handler) {
                this.capture(message);

                // if the handler is a normal function, just execute it!
                // NOTE: anyone who passes in their own handler has to call
                // convo.next() to continue after completing whatever it is they want to do.
                if (typeof(this.handler) == 'function') {
                    this.handler(message, this);
                } else {
                    // handle might be a mapping of keyword to callback.
                    // lets see if the message matches any of the keywords
                    var match, patterns = this.handler;
                    for (var p = 0; p < patterns.length; p++) {
                        if (patterns[p].pattern && (match = message.text.match(patterns[p].pattern))) {
                            message.match = match;
                            patterns[p].callback(message, this);
                            return;
                        }
                    }

                    // none of the messages matched! What do we do?
                    // if a default exists, fire it!
                    for (var p = 0; p < patterns.length; p++) {
                        if (patterns[p].default) {
                            patterns[p].callback(message, this);
                            return;
                        }
                    }

                }
            } else {
                // do nothing
            }
        };

        this.activate = function() {
            this.status = 'active';
        };

        /**
         * active includes both ACTIVE and ENDING
         * in order to allow the timeout end scripts to play out
         **/
        this.isActive = function() {
            return (this.status == 'active' || this.status == 'ending');
        };

        this.deactivate = function() {
            this.status = 'inactive';
        };

        this.say = function(message) {
            this.addMessage(message);
        };

        this.sayFirst = function(message) {
            if (typeof(message) == 'string') {
                message = {
                    text: message,
                    channel: this.source_message.channel,
                };
            } else {
                message.channel = this.source_message.channel;
            }
            this.messages.unshift(message);
        };


        this.on = function(event, cb) {
            botkit.debug('Setting up a handler for', event);
            var events = event.split(/\,/g);
            for (var e in events) {
                if (!this.events[events[e]]) {
                    this.events[events[e]] = [];
                }
                this.events[events[e]].push(cb);
            }
            return this;
        };

        this.trigger = function(event, data) {
            if (this.events[event]) {
                for (var e = 0; e < this.events[event].length; e++) {
                    var res = this.events[event][e].apply(this, data);
                    if (res === false) {
                        return;
                    }
                }
            } else {
                botkit.debug('No handler for ', event);
            }
        };

        // proceed to the next message after waiting for an answer
        this.next = function() {
            this.handler = null;
        };

        this.repeat = function() {
            if (this.sent.length) {
                this.messages.push(this.sent[this.sent.length - 1]);
            } else {
                // console.log('TRIED TO REPEAT, NOTHING TO SAY');
            }
        };

        this.silentRepeat = function() {
            return;
        };

        this.addQuestion = function(message, cb, capture_options, topic) {
            if (typeof(message) == 'string') {
                message = {
                    text: message,
                    channel: this.source_message.channel
                };
            } else {
                message.channel = this.source_message.channel;
            }

            if (capture_options) {
                message.capture_options = capture_options;
            }

            message.handler = cb;
            this.addMessage(message, topic);
        };


        this.ask = function(message, cb, capture_options) {
            this.addQuestion(message, cb, capture_options, this.topic || 'default');
        };

        this.addMessage = function(message, topic) {
            if (!topic) {
                topic = this.topic;
            }
            if (typeof(message) == 'string') {
                message = {
                    text: message,
                    channel: this.source_message.channel,
                };
            } else {
                message.channel = this.source_message.channel;
            }

            if (!this.topics[topic]) {
                this.topics[topic] = [];
            }
            this.topics[topic].push(message);

            // this is the current topic, so add it here as well
            if (this.topic == topic) {
                this.messages.push(message);
            }
        };

        this.changeTopic = function(topic) {
            this.topic = topic;

            if (!this.topics[topic]) {
                this.topics[topic] = [];
            }
            this.messages = this.topics[topic].slice();

            this.handler = null;
        };

        this.combineMessages = function(messages) {
            if (messages.length > 1) {
                var txt = [];
                var last_user = null;
                var multi_users = false;
                last_user = messages[0].user;
                for (var x = 0; x < messages.length; x++) {
                    if (messages[x].user != last_user) {
                        multi_users = true;
                    }
                }
                last_user = '';
                for (var x = 0; x < messages.length; x++) {
                    if (multi_users && messages[x].user != last_user) {
                        last_user = messages[x].user;
                        if (txt.length) {
                            txt.push('');
                        }
                        txt.push('<@' + messages[x].user + '>:');
                    }
                    txt.push(messages[x].text);
                }
                return txt.join('\n');
            } else {
                if (messages.length) {
                    return messages[0].text;
                } else {
                    return messages.text;
                }
            }
        };

        this.extractResponses = function() {

            var res = {};
            for (var key in this.responses) {
                res[key] = this.extractResponse(key);
            }
            return res;
        };

        this.extractResponse = function(key) {
            return this.combineMessages(this.responses[key]);
        };

        this.replaceTokens = function(text) {

            var vars = {
                identity: this.task.bot.identity,
                responses: this.extractResponses(),
                origin: this.task.source_message,
                vars: this.vars,
            };
            return mustache.render(text, vars);
        };

        this.stop = function(status) {
            this.handler = null;
            this.messages = [];
            this.status = status || 'stopped';
            botkit.debug('Conversation is over!');
            this.task.conversationEnded(this);
        };

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
                        (lastActive > (60 * 1000)) // nobody has typed for 60 seconds at least
                    ) {

                        if (this.topics.timeout) {
                            this.status = 'ending';
                            this.changeTopic('timeout');
                        } else {
                            this.stop('timeout');
                        }
                    }
                    // otherwise do nothing
                } else {
                    if (this.messages.length) {
                        if (typeof(this.messages[0].timestamp) == 'undefined' ||
                            this.messages[0].timestamp <= now.getTime()) {
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
                                message.text = message.text && this.replaceTokens(message.text) || "";
                                if (this.messages.length && !message.handler) {
                                    message.continue_typing = true;
                                }

                                if (typeof(message.attachments) == 'function') {
                                    message.attachments = message.attachments(this);
                                }

                                this.task.bot.say(message, function(err) {
                                    if (err) {
                                        botkit.log('An error occurred while sending a message: ', err);
                                    }
                                });
                            }
                            if (message.action) {
                                if (message.action == 'repeat') {
                                    this.repeat();
                                } else if (message.action == 'wait') {
                                    this.silentRepeat();
                                } else if (message.action == 'stop') {
                                    this.stop();
                                } else if (message.action == 'timeout') {
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
                            this.status = 'completed';
                            botkit.debug('Conversation is over!');
                            this.task.conversationEnded(this);
                        }

                    } else if (this.sent.length) { // sent at least 1 message
                        this.status = 'completed';
                        botkit.debug('Conversation is over!');
                        this.task.conversationEnded(this);
                    }
                }
            }
        };

        botkit.debug('CREATED A CONVO FOR', this.source_message.user, this.source_message.channel);
        this.changeTopic('default');
    };

    function Task(bot, message, botkit) {

        this.convos = [];
        this.botkit = botkit;
        this.bot = bot;

        this.events = {};
        this.source_message = message;
        this.status = 'active';
        this.startTime = new Date();

        this.isActive = function() {
            return this.status == 'active';
        };

        this.startConversation = function(message) {
            var convo = new Conversation(this, message);
            convo.id = botkit.convoCount++;

            botkit.log('>   [Start] ', convo.id, ' Conversation with ', message.user, 'in', message.channel);

            convo.activate();
            this.convos.push(convo);
            this.trigger('conversationStarted', [convo]);
            return convo;
        };

        this.conversationEnded = function(convo) {
            botkit.log('>   [End] ', convo.id, ' Conversation with ',
                       convo.source_message.user, 'in', convo.source_message.channel);
            this.trigger('conversationEnded', [convo]);
            convo.trigger('end', [convo]);
            var actives = 0;
            for (var c = 0; c < this.convos.length; c++) {
                if (this.convos[c].isActive()) {
                    actives++;
                }
            }
            if (actives == 0) {
                this.taskEnded();
            }

        };

        this.taskEnded = function() {
            botkit.log('[End] ', this.id, ' Task for ',
                this.source_message.user, 'in', this.source_message.channel);

            this.status = 'completed';
            this.trigger('end', [this]);

        };

        this.on = function(event, cb) {
            botkit.debug('Setting up a handler for', event);
            var events = event.split(/\,/g);
            for (var e in events) {
                if (!this.events[events[e]]) {
                    this.events[events[e]] = [];
                }
                this.events[events[e]].push(cb);
            }
            return this;
        };

        this.trigger = function(event, data) {
            if (this.events[event]) {
                for (var e = 0; e < this.events[event].length; e++) {
                    var res = this.events[event][e].apply(this, data);
                    if (res === false) {
                        return;
                    }
                }
            } else {
                botkit.debug('No handler for ', event);
            }
        };


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

        };

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
        };

        this.tick = function() {

            for (var c = 0; c < this.convos.length; c++) {
                if (this.convos[c].isActive()) {
                    this.convos[c].tick();
                }
            }
        };
    };

    botkit.storage = {
        teams: {
            get: function(team_id, cb) {
                cb(null, botkit.memory_store.teams[team_id]);
            },
            save: function(team, cb) {
                botkit.log('Warning: using temporary storage. Data will be lost when process restarts.');
                if (team.id) {
                    botkit.memory_store.teams[team.id] = team;
                    cb(null, team.id);
                } else {
                    cb('No ID specified');
                }
            },
            all: function(cb) {
                cb(null, botkit.memory_store.teams);
            }
        },
        users: {
            get: function(user_id, cb) {
                cb(null, botkit.memory_store.users[user_id]);
            },
            save: function(user, cb) {
                botkit.log('Warning: using temporary storage. Data will be lost when process restarts.');
                if (user.id) {
                    botkit.memory_store.users[user.id] = user;
                    cb(null, user.id);
                } else {
                    cb('No ID specified');
                }
            },
            all: function(cb) {
                cb(null, botkit.memory_store.users);
            }
        },
        channels: {
            get: function(channel_id, cb) {
                cb(null, botkit.memory_store.channels[channel_id]);
            },
            save: function(channel, cb) {
                botkit.log('Warning: using temporary storage. Data will be lost when process restarts.');
                if (channel.id) {
                    botkit.memory_store.channels[channel.id] = channel;
                    cb(null, channel.id);
                } else {
                    cb('No ID specified');
                }
            },
            all: function(cb) {
                cb(null, botkit.memory_store.channels);
            }
        }
    };

    botkit.debug = function() {
        if (configuration.debug) {
            var args = [];
            for (var k = 0; k < arguments.length; k++) {
                args.push(arguments[k]);
            }
            console.log.apply(null, args);
        }
    };

    botkit.log = function() {
        if (configuration.log || configuration.log === undefined) { //default to true
            var args = [];
            for (var k = 0; k < arguments.length; k++) {
                args.push(arguments[k]);
            }
            console.log.apply(null, args);
        }
    };

    botkit.hears = function(keywords, events, cb) {
        if (typeof(keywords) == 'string') {
            keywords = [keywords];
        }
        if (typeof(events) == 'string') {
            events = events.split(/\,/g);
        }

        var match;
        for (var k = 0; k < keywords.length; k++) {
            var keyword = keywords[k];
            for (var e = 0; e < events.length; e++) {
                (function(keyword) {
                    botkit.on(events[e], function(bot, message) {
                        if (message.text) {
                            if (match = message.text.match(new RegExp(keyword, 'i'))) {
                                botkit.debug('I HEARD ', keyword);
                                message.match = match;
                                cb.apply(this, [bot, message]);
                                return false;
                            }
                        }
                    });
                })(keyword);
            }
        }
        return this;
    };

    botkit.on = function(event, cb) {
        botkit.debug('Setting up a handler for', event);
        var events = (typeof(event) == 'string') ? event.split(/\,/g) : event;

        for (var e in events) {
            if (!this.events[events[e]]) {
                this.events[events[e]] = [];
            }
            this.events[events[e]].push(cb);
        }
        return this;
    };

    botkit.trigger = function(event, data) {
        if (this.events[event]) {
            for (var e = 0; e < this.events[event].length; e++) {
                var res = this.events[event][e].apply(this, data);
                if (res === false) {
                    return;
                }
            }
        } else {
            botkit.debug('No handler for ', event);
        }
    };

    botkit.startConversation = function(bot, message, cb) {
        botkit.startTask(bot, message, function(task, convo) {
            cb(null, convo);
        });
    };

    botkit.defineBot = function(unit) {
        if (typeof(unit) != 'function') {
            throw new Error('Bot definition must be a constructor function');
        }
        this.worker = unit;
    };

    botkit.spawn = function(config, cb) {
        var worker = new this.worker(this, config);
        if (cb) { cb(worker); }
        return worker;
    };

    botkit.startTicking = function() {
        if (!botkit.tickInterval) {
            // set up a once a second tick to process messages
            botkit.tickInterval = setInterval(function() {
                botkit.tick();
            }, 1000);
        }
    };

    botkit.shutdown = function() {
        if (botkit.tickInterval) {
            clearInterval(botkit.tickInterval);
        }
    };

    botkit.startTask = function(bot, message, cb) {


        var task = new Task(bot, message, this);

        task.id = botkit.taskCount++;
        botkit.log('[Start] ', task.id, ' Task for ', message.user, 'in', message.channel);

        var convo = task.startConversation(message);

        this.tasks.push(task);

        if (cb) {
            cb(task, convo);
        } else {
            return task;
        }

    };

    botkit.receiveMessage = function(bot, message) {
        botkit.debug('RECEIVED MESSAGE');
        bot.findConversation(message, function(convo) {
            if (convo) {
                convo.handle(message);
            } else {
                botkit.trigger('message_received', [bot, message]);
            }
        });
    };

    botkit.tick = function() {
        for (var t = 0; t < botkit.tasks.length; t++) {
            botkit.tasks[t].tick();
        }
        for (var t = botkit.tasks.length - 1; t >= 0; t--) {
            if (!botkit.tasks[t].isActive()) {
                botkit.tasks.splice(t, 1);
            }
        }


        this.trigger('tick', []);

    };


    /**
     * Define a default worker bot. This function should be customized outside
     * of Botkit and passed in as a parameter by the developer
     **/
    botkit.worker = function(botkit, config) {
        this.botkit = botkit;
        this.config = config;

        this.say = function(message, cb) {
            botkit.debug('SAY: ', message);
        };

        this.replyWithQuestion = function(message, question, cb) {

            botkit.startConversation(message, function(convo) {
                convo.ask(question, cb);
            });

        };

        this.reply = function(src, resp) {
            botkit.debug('REPLY: ', resp);
        };


        this.findConversation = function(message, cb) {
            botkit.debug('DEFAULT FIND CONVO');
            cb(null);
        };
    };

    botkit.config = configuration;

    if (!configuration.logLevel) {
        if (configuration.debug) {
            configuration.logLevel = 'debug';
        } else if (configuration.log === false) {
            configuration.logLevel = 'error';
        } else {
            configuration.logLevel = 'info';
        }
    }

    if (configuration.logger) {
        if (typeof configuration.logger.log === 'function') {
            botkit.logger = configuration.logger;
        } else {
            throw new Error('Logger object does not have a `log` method!');
        }
    } else {
        botkit.logger = ConsoleLogger(console, configuration.logLevel);
    }

    botkit.log = function() {
        botkit.log.info.apply(botkit.log, arguments);
    };
    Object.keys(LogLevels).forEach(function(level) {
        botkit.log[level] = botkit.logger.log.bind(botkit.logger, level);
    });
    botkit.debug = botkit.log.debug;

    if (configuration.storage) {
        if (
            configuration.storage.teams &&
            configuration.storage.teams.get &&
            configuration.storage.teams.save &&

            configuration.storage.users &&
            configuration.storage.users.get &&
            configuration.storage.users.save &&

            configuration.storage.channels &&
            configuration.storage.channels.get &&
            configuration.storage.channels.save
        ) {
            botkit.log('** Using custom storage system.');
            botkit.storage = configuration.storage;
        } else {
            throw new Error('Storage object does not have all required methods!');
        }
    } else if (configuration.json_file_store) {
        botkit.log('** Using simple storage. Saving data to ' + configuration.json_file_store);
        botkit.storage = simple_storage({path: configuration.json_file_store});
    } else {
        botkit.log('** No persistent storage method specified! Data may be lost when process shuts down.');
    }

    return botkit;
}

module.exports = Botkit;
