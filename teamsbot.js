
var Botkit = require('./lib/Botkit.js');
var os = require('os');
var request = require('request');

var controller = Botkit.teamsbot({
    debug: false,
    client_id: '42e50cc5-9469-4ee0-b806-97563f4cc841',
    client_secret: 'D0PBfwsDZvmxdzFbAzYm1JT',
});

controller.on('invoke', function(bot, message) {

  console.log('INVOKE BUTTON CLICKED');

  bot.reply(message, 'heard an invoke postback')

})

controller.on('mention', function(bot, message) {

  bot.reply(message, ' You mentioned me?');


});
controller.hears('.*','direct_message, direct_mention', function(bot, message) {

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
                  type: 'invoke',
                  title: 'picture click',
                  value: JSON.stringify({'foo':'bar'}),
                }
            }
          ],
          buttons: [
            {
              title: 'Drink me',
              type: 'invoke',
              value: JSON.stringify({'foo':'bar'}),
            },
            {
              title: 'Drink me',
              type: 'imBack',
              value: 'I CLICK A BUTTON',
            },
            {
              title: 'Open Url',
              type: 'openUrl',
              value: 'https://botkit.ai',
            },


          ]
        }
      }
    ]
  });

});


controller.setupWebserver(3000,function() {
  controller.configureIncomingWebhook();

});
