module.exports = function(botkit) {

    return {
        name: 'Verbose Console Logger',
        init: function(botkit) {
            // Log requests to console using an Express middleware
            botkit.webserver.use(function(req, res, next) {
                console.log('> ', req.url);
                next();
            });

            botkit.publicFolder('/public',__dirname + '/public');


        },
        middlewares: {
            ingest: [
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