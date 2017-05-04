
var Botkit = require('./lib/Botkit.js');
var os = require('os');
var request = require('request');

var controller = Botkit.teamsbot({
    debug: true,
    client_id: '69b4bbd8-db62-4657-a944-5b380edcb0a2',
    client_secret: '7B8xGpEYuo0e7wODuqxdamk',
});

controller.on('teams_button_click', function(bot, message) {

  controller.trigger(message.button_name, [bot, message]);

})

controller.hears('.*','message_received', function(bot, message) {

    var reply = {
      text: 'ok',
      attachments: [
        {
            text: '*hello*\n\nthis is markdown I hope\n\nWeee!!',
            title: 'TITLE!',
            subtitle: 'This is the subtitle',
            fields: [
              {
                title: 'Hello',
                value: 'Blarg',
              }
            ],
            actions: [
              {
                text: 'Button 1',
                name: 'foo',
                value: 'button1',
                type: 'button',
              },
              {
                text: 'Button 2',
                name: 'bar',
                value: 'button2',
                type: 'button',
              }
            ]
          }
      ]
    }
    bot.reply(message, controller.slackToTeams(reply));

});


controller.setupWebserver(3000,function() {
  controller.configureIncomingWebhook();

//     controller.webserver.post('/teams/receive', function(req, res) {
//
//         console.log('RECEIVED EVENT', req.body);
//         res.send('');
//
//         var message = req.body;
//         if (message.type == 'message') {
//             var bot = controller.spawn({});
//             controller.receiveMessage(bot, {
//                 user: message.from.id,
//                 channel: message.conversation.id,
//                 text: message.text,
//                 original_message: message,
//             });
//         } else {
//             controller.trigger(message.type,[bot, message]);
//         }
//
// });

});
