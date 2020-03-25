const { BotkitConversation } = require('botkit');

module.exports = function(controller) {

    if (controller.adapter.name == 'Webex Adapter') {

      controller.ready(async function() {
        await controller.adapter.registerAdaptiveCardWebhookSubscription('/api/messages');
      });

    const NEW_ROOM_DIALOG = 'new_room_dialog';
    const dialog = new BotkitConversation(NEW_ROOM_DIALOG, controller);
    dialog.say('I created this room so we could continue our conversation in private...');
    dialog.ask('How does that sound?', async(response, convo, bot) => {

    }, {key: 'how_it_sounds'});
    dialog.say('Ah, {{vars.how_it_sounds}}, eh?');
    dialog.say('I guess that is that.')

    controller.addDialog(dialog);

    controller.hears('delete','message,direct_message', async(bot, message) => {

        let reply = await bot.reply(message,'This message will be deleted in a few seconds.');
        setTimeout(async () => {
            let res = await bot.deleteMessage(reply);
        }, 5000);

    });

    controller.hears('adaptive_card','message,direct_message', async(bot, message) => {
        let card = {
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.0",
        "body": [
          {
            "type": "ColumnSet",
            "columns": [
              {
                "type": "Column",
                "width": 2,
                "items": [
                  {
                    "type": "TextBlock",
                    "text": "Tell us about yourself",
                    "weight": "bolder",
                    "size": "medium"
                  },
                  {
                    "type": "TextBlock",
                    "text": "We just need a few more details to get you booked for the trip of a lifetime!",
                    "isSubtle": true,
                    "wrap": true
                  },
                  {
                    "type": "TextBlock",
                    "text": "Don't worry, we'll never share or sell your information.",
                    "isSubtle": true,
                    "wrap": true,
                    "size": "small"
                  },
                  {
                    "type": "TextBlock",
                    "text": "Your name",
                    "wrap": true
                  },
                  {
                    "type": "Input.Text",
                    "id": "Name",
                    "placeholder": "John Andersen"
                  },
                  {
                    "type": "TextBlock",
                    "text": "Your website",
                    "wrap": true
                  },
                  {
                    "type": "Input.Text",
                    "id" : "Url",
                    "placeholder": "https://example.com"
                  },
                  {
                    "type": "TextBlock",
                    "text": "Your email",
                    "wrap": true
                  },
                  {
                    "type": "Input.Text",
                    "id": "Email",
                    "placeholder": "john.andersen@example.com",
                    "style": "email"
                  },
                  {
                    "type": "TextBlock",
                    "text": "Phone Number"
                  },
                  {
                    "type": "Input.Text",
                    "id": "Tel",
                    "placeholder": "+1 408 526 7209",
                    "style": "tel"
                  }
                ]
              },
              {
                "type": "Column",
                "width": 1,
                "items": [
                  {
                    "type": "Image",
                    "url": "https://upload.wikimedia.org/wikipedia/commons/b/b2/Diver_Silhouette%2C_Great_Barrier_Reef.jpg",
                    "size": "auto"
                  }
                ]
              }
            ]
          }
        ],
        "actions": [
          {
            "type": "Action.Submit",
            "title": "Submit"
          }
        ]
      };

          await bot.reply(message, {
              text: 'here is a card',
              attachments: [{
                  content: card,
                  "contentType": "application/vnd.microsoft.card.adaptive",
                }],
          });
    })

    controller.on('attachmentActions', async(bot, message) => {
      console.log('GOT A CARD SUBMIT', message);
    });
    
    controller.hears('threaded', 'message,direct_message', async(bot, message) => {
      
      let text = 'I\'m responding to you in a thread!';
      await bot.replyInThread(message, {markdown: text});


      // message.parentId ? message.parentId : message.id
      //  if the message is in the main channel, respond in a thread
      //  if the message is already in a thread, respond to the same thread
      await bot.startConversationInThread(message.channel, message.user, (message.parentId ? message.parentId : message.id));
      await bot.say('And this should also be in that thread!');
    });

    controller.hears('create a room','message,direct_message', async(bot, message) => {

        // create a room
        let room = await bot.api.rooms.create({title: 'botkit test room'});

        // add user as member (bot is automatically added)
        let membership2 = await bot.api.memberships.create({
            roomId: room.id,
            personId: message.user,
        });

        await bot.startConversationInRoom(room.id, message.user);
        await bot.beginDialog(NEW_ROOM_DIALOG);

    });

    controller.on('memberships.created', async(bot, message) => {
        console.log('memberships created', message);
    });

    controller.hears('orgId', 'message, direct_message', async(bot, message) => {
        await bot.reply(message, 'Your org id is ' + message.orgId);
    });

    controller.on('direct_message', async(bot, message) => {
        await bot.reply(message, 'I heard a DM on webex');
    });

  }

}