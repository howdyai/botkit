var Botkit = require('../lib/Botkit.js');
var controller = Botkit.googlehangoutsbot({
    endpoint: 'Axjn86rTGRQwisaYFyT0XZyiOCh7rZUPGx1A',
    token: "efe_CIaKfFDdQlm_HBnQBkVeJUC_yNF3Uhs2lNeCdYs=",
    debug: true,
});
var bot = controller.spawn({});

controller.setupWebserver(3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log('ONLINE!');
    });
});

controller.hears('hello', 'message_received', function(bot, message) {
    console.log("2 >> " + message.text);
});