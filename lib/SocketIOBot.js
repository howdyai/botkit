var Botkit = require(__dirname + '/CoreBot.js');
var app = require('http').createServer()
var io = require('socket.io')(app);
var channels = {};

function SocketIOBot(configuration) {

    // Create a core botkit bot
    var socketio_botkit = Botkit(configuration || {});


    socketio_botkit.middleware.spawn.use(function(bot, next) {

        app.listen(
            configuration.port,
            configuration.hostname,
            function() {
                socketio_botkit.log('** Starting socket.io server on ' +
                    app.address().address + ':' + app.address().port);
            });
        socketio_botkit.listenIncoming(bot);
        next();

    });

    socketio_botkit.defineBot(function(botkit, config) {

        var bot = {
            botkit: botkit,
            config: config || {},
            utterances: botkit.utterances,
        };

        bot.startConversation = function(message, cb) {
            botkit.startConversation(this, message, cb);
        };

        bot.send = function(message, cb) {
            channels[message.channel].emit('message', message.text);
        };

        bot.reply = function(src, resp, cb) {
            var msg = {};

            if (typeof(resp) == 'string') {
                msg.text = resp;
            } else {
                msg = resp;
            }

            msg.channel = src.channel;

            bot.say(msg, cb);
        };

        bot.findConversation = function(message, cb) {
            botkit.debug('CUSTOM FIND CONVO', message.user, message.channel);
            for (var t = 0; t < botkit.tasks.length; t++) {
                for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
                    if (
                        botkit.tasks[t].convos[c].isActive() &&
                        botkit.tasks[t].convos[c].source_message.user == message.user
                    ) {
                        botkit.debug('FOUND EXISTING CONVO!');
                        cb(botkit.tasks[t].convos[c]);
                        return;
                    }
                }
            }

            cb();
        };

        return bot;

    });

    socketio_botkit.listenIncoming = function(bot) {

        socketio_botkit.startTicking();
        io.on('connection', function(socket) {
            channels[socket.id] = socket;
            socket.on('incoming', function(data) {
                var message = {
                    text: data,
                    user: socket.id,
                    channel: socket.id,
                    timestamp: Date.now()
                };
                socketio_botkit.receiveMessage(bot, message);
            });

            socket.on('disconnect', function() {
                delete channels[socket.id];
            });
        });
    };

    return socketio_botkit;
};

module.exports = SocketIOBot;
