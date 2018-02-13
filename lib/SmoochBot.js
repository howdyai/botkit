var Botkit = require(__dirname + '/CoreBot.js');

function SmoochBot(configuration) {
    var smooch_botkit = Botkit(configuration || {});

    var excludedEvents = ['message:appMaker',
                          'conversation:read',
                          'conversation:start'];

    smooch_botkit.excludeFromConversations(excludedEvents);

    smooch_botkit.middleware.normalize.use(function(bot, message, next) {

        if (message.type === 'message:appUser') {
            message.type = 'message_received';
            message.text = message.raw_message.message.text;
        } else {
            message.type = message.raw_message.trigger;
        }

        message.user = message.raw_message.appUser._id;
        message.channel = message.raw_message.appUser._id;
        message.appId = message.raw_message.app._id;

        next();
    });

    smooch_botkit.middleware.format.use(function(bot, message, platform_message, next) {
        platform_message.appId = message.appId;
        platform_message.userId = message.user;
        platform_message.role = message.role;
        platform_message.type = message.type;
        platform_message.name = message.name;
        platform_message.email = message.email;
        platform_message.avatarUrl = message.avatarUrl;
        platform_message.destination = message.destination;
        platform_message.metadata = message.metadata;
        platform_message.payload = message.payload;

        if (platform_message.type === 'text') {
            platform_message.text = message.text;
            platform_message.actions = message.actions;
        } else if (platform_message.type === 'image') {
            platform_message.text = message.text;
            platform_message.actions = message.actions;
            platform_message.mediaUrl = message.mediaUrl;
            platform_message.mediaType = message.mediaType;
        } else if (platform_message.type === 'file') {
            platform_message.text = message.text;
            platform_message.mediaUrl = message.mediaUrl;
            platform_message.mediaType = message.mediaType;
        } else if (platform_message.type === 'location') {
            platform_message.coordinates = message.coordinates;
        } else if (platform_message.type === 'carousel') {
            platform_message.items = message.items;
            platform_message.displaySettings = message.displaySettings;
        } else if (platform_message.type === 'list') {
            platform_message.items = message.items;
            platform_message.actions = message.actions;
        }

        next();
    });

    smooch_botkit.defineBot(require(__dirname + '/SmoochBot_worker.js'));

    smooch_botkit.createWebhookEndpoints = function(webserver, bot, cb) {
        webserver.post('/smooch/receive', function(req, res) {
            res.send('ok');

            for (var i = 0; i < req.body.messages.length; i++) {
                var entry = req.body.messages[i];
                var message = {};
                message.message = entry;
                message.trigger = req.body.trigger;
                message.appUser = req.body.appUser;
                message.app = req.body.app;

                smooch_botkit.ingest(bot, message, res);
            }
        });

        if (cb) {
            cb();
        }

        return smooch_botkit;
    };

    smooch_botkit.startTicking();

    return smooch_botkit;
}

module.exports = SmoochBot;
