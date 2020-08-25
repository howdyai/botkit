const { TeamsInvokeMiddleware } = require('botkit');

module.exports = function(controller) {

    if (!controller.adapter.name) {

      controller.adapter.use(new TeamsInvokeMiddleware());

      const adaptiveCard = {
        "type": "AdaptiveCard",
        "body": [
            {
                "type": "TextBlock",
                "text": "Here is a ninja cat:"
            },
            {
                "type": "Image",
                "url": "http://adaptivecards.io/content/cats/1.png",
                "size": "Medium"
            },
            {
              "type": "ActionSet",
              "actions": [
                  {
                      "type": "Action.Submit",
                      "title": "Message Submit",
                      "id": "begin",
                      "data": {
                          "command": "message"
                      }
                  },
                  {
                    "type": "Action.Submit",
                    "title": "Card Submit",
                    "id": "begin",
                    "data": {
                        "command": "card"
                    }
                  },
                  {
                    "type": "Action.Submit",
                    "title": "Close",
                    "id": "begin",
                    "data": {
                        "command": "close"
                    }
                },
              ],
              "horizontalAlignment": "Center"
          }
        ],
        "version": "1.0"
    }

        controller.hears('getTeamDetails', 'message', async(bot, message) => {
          try {
            await bot.reply(message, JSON.stringify(await bot.teams.getTeamDetails(bot.getConfig('context'))));
          } catch(err) {
            await bot.reply(message, err.message);
          }
        });

        controller.hears('getTeamChannels', 'message', async(bot, message) => {
          try {
            await bot.reply(message, JSON.stringify(await bot.teams.getTeamChannels(bot.getConfig('context'))));
          } catch(err) {
            await bot.reply(message, err.message);
          }
        });


        controller.hears('getMember', 'message', async(bot, message) => {
          try {
            await bot.reply(message, JSON.stringify(await bot.teams.getMember(bot.getConfig('context'), message.user)));
          } catch(err) {
            await bot.reply(message, err.message);
          }
        });

        controller.hears('taskModule', 'message', async(bot, message) => {
          await bot.reply(message,{
            attachments: [{
                "contentType": "application/vnd.microsoft.card.hero",
                "content": {
                    "buttons": [
                        {
                            "type": "invoke",
                            "title": "Task Module",
                            "value": {type: 'task/fetch'}
                        }
                    ],
                    "text": "Launch a task module by clicking the button.",
                    "title": "INVOKE A TASK MODULE!"
                }
            }]
        });
      });

      controller.on('task/fetch', async(bot, message) => {
        await bot.replyWithTaskInfo(message,{
              "type": "continue",
              "value": {
                "title": "Task module title",
                "height": 500,
                "width": "medium",
                card: {
                  contentType: 'application/vnd.microsoft.card.adaptive',
                  content: adaptiveCard,
                }
              }
          })
      });


    controller.on('task/submit', async(bot, message) => {

        if (message.value.data.command == 'message') {
          // reply with a message
          await bot.replyWithTaskInfo(message, {
              type: 'message',
              value: 'Submitted!',
          });
        } else if (message.value.data.command == 'card') {
            // reply with another card
          await bot.replyWithTaskInfo(message, {
              "type": "continue",
              "value": {
                "title": "Task module title",
                "height": 500,
                "width": "medium",
                card: {
                  contentType: 'application/vnd.microsoft.card.adaptive',
                  content: adaptiveCard,
                }
              }
          });
        } else {
            // just close the task module
            await bot.replyWithTaskInfo(message, null);
        }

      });

    }
}