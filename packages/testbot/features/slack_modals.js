module.exports = function(controller) {

    if (controller.adapter.name === 'Slack Adapter') {

        controller.hears('modal','direct_message,direct_mention,mention', async(bot, message) => {

            const responseCard = {
              attachments: [
                {
                  text: 'Click the button to launch a modal.',
                  actions: [
                    {
                      name: 'modal',
                      type: 'button',
                      text: 'Open Modal',
                      value: 'modal',
                    }
                  ],
                  callback_id: 'modal',
                }
              ]
            };

            await bot.reply(message, responseCard);

        });

        controller.on('interactive_message', async(bot, message) => {
          if (message.actions[0].name === 'modal') {
              const trigger_id = message.trigger_id;
              const response = await bot.api.views.open({
                trigger_id: trigger_id,
                view: {
                  "type": "modal",
                  "callback_id": "modal-identifier",
                  "title": {
                    "type": "plain_text",
                    "text": "Just a modal"
                  },
                  "blocks": [
                    {
                      "type": "section",
                      "block_id": "section-identifier",
                      "text": {
                        "type": "mrkdwn",
                        "text": "This is a sample modal"
                      },
                      "accessory": {
                        "type": "button",
                        "text": {
                          "type": "plain_text",
                          "text": "Update this modal",
                        },
                        "value": "update_modal",
                        "action_id": "button-identifier",
                      }
                    },
                  ]
                }
              });
          }
        });

        controller.hears('update_modal','block_actions', async(bot, message) => {

          const response = await bot.api.views.update({
            view_id: message.container.view_id,
            view: {
              "type": "modal",
              "callback_id": "modal-identifier",
              "title": {
                "type": "plain_text",
                "text": "Just a modal"
              },
              "blocks": [
                {
                  "type": "section",
                  "block_id": "section-identifier",
                  "text": {
                    "type": "mrkdwn",
                    "text": "This is a sample modal"
                  }
                },
                {
                  "type": "input",
                  "block_id": "ticket-title",
                  "label": {
                    "type": "plain_text",
                    "text": "Ticket title"
                  },
                  "element": {
                    "type": "plain_text_input",
                    "action_id": "ticket-title-value"
                  }
                },
                {
                  "type": "input",
                  "block_id": "ticket-desc",
                  "label": {
                    "type": "plain_text",
                    "text": "Ticket description"
                  },
                  "element": {
                    "type": "plain_text_input",
                    "multiline": true,
                    "action_id": "ticket-desc-value"
                  }
                }
              ],
              "submit": {
                "type": "plain_text",
                "text": "Submit"
              }
            }
          });

        });


        controller.on('view_submission', async(bot, message) => {
          console.log('VIEW SUBMISSION', message.view.state.values);
          bot.httpBody({
            response_action: 'errors',
            errors: {
              "ticket-desc": 'I will never accept a value, you are doomed!'
            }
          })

        })

    }
}

