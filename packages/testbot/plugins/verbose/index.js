module.exports = function(botkit) {

    return {
        name: 'Verbose Console Logger',
        init: function(botkit) {
            // Log requests to console using an Express middleware
            if (botkit.webserver) {
                botkit.webserver.use(function(req, res, next) {
                    console.log('> ', req.url);
                    next();
                });
            }

        },
        middlewares: {
            receive: [
                function(bot, message, next) {
                    console.log(`RCVD > ${ message.type } >`, message.text);
                    next();
                }
            ],
            send: [
                function(bot, message, next) {
                    console.log('SENT > ', message.text);
                    next();
                }
            ]
        }
    }
}