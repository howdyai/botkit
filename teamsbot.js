
var Botkit = require('./lib/Botkit.js');
var os = require('os');
var request = require('request');

var controller = Botkit.teamsbot({
    debug: true,
    client_id: '42e50cc5-9469-4ee0-b806-97563f4cc841',
    client_secret: 'D0PBfwsDZvmxdzFbAzYm1JT',
});

controller.on('teams_button_click', function(bot, message) {

  controller.trigger(message.button_name, [bot, message]);

})

controller.hears('.*','message_received', function(bot, message) {

  bot.reply(message, {
    text: ':)',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.hero',
        content: {
          title: 'Hero card',
          subtitle: 'Subtitle of hero card',
          text: 'This is the text',
          images: [
            {
                url: 'http://placekitten.com/1600/900',
                alt: 'a kitten',
                tap: {
                  type: 'postback',
                  value: 'foo',
                }
            }
          ],
          buttons: [
            {
              title: 'Drink me',
              type: 'postback',
              value: 'foo',
            }
          ]
        }
      }
    ]
  });

});


controller.setupWebserver(3000,function() {
  controller.configureIncomingWebhook();

});
