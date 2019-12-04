const { BotkitConversation } = require('botkit');


module.exports = function(controller) {

    if (controller.adapter.name === 'Facebook Adapter') {
    /**
     * Detect when a message has a sticker attached
     */
    controller.hears(async(message) => message.sticker_id, 'message', async(bot, message) => {
        await bot.reply(message,'Cool sticker.');
    });


    controller.hears(new RegExp('quick'), 'message', async (bot, message) => {

      await bot.reply(message,{
          text: 'Here are some quick replies',
          quick_replies: [
              {
                  title: 'Foo',
                  payload: 'foo',
              },
              {
                  title: 'Bar',
                  payload: 'bar',
              }
          ]
      });
  });
  
    /**
     * Detect a button click 
     */
    controller.on('facebook_postback', async(bot, message) => {
        await bot.reply(message,`I heard you posting back a post_back about ${ message.text }`);
    });



    let typing = new BotkitConversation('typing', controller);

    typing.say('I am going to type for a while now...');
    typing.addAction('typing');

    // start the typing indicator
    typing.addMessage({channelData: {sender_action: 'typing_on'}}, 'typing');
    // trigger a gotoThread, which gives us an opportunity to delay the next message
    typing.addAction('next_thread','typing');

    typing.addMessage('typed!','next_thread');

   // use the before handler to delay the next message 
    typing.before('next_thread',  async() => {
        return new Promise((resolve, reject) => {
            // simulate some long running process
            setTimeout(resolve, 3000);
        });
    });

    controller.addDialog(typing);

    controller.hears('typing dialog', 'message', async(bot, message) => {
        await bot.beginDialog('typing');
    });

    controller.hears('typing reply', 'message', async(bot, message) => {

      await bot.reply(message,{sender_action: 'typing_on'});
      setTimeout(async function() {
        await bot.changeContext(message.reference);
        await bot.reply(message,'typing done');
      }, 3000);

    });


    controller.ready(async () => {
        // example of proactive message
        let bot = await controller.spawn(process.env.FACEBOOK_PAGE_ID);
        bot.startConversationWithUser(process.env.FACEBOOK_ADMIN_USER).then(async () => {
            let res = await bot.say('Hello human');
            console.log('results of proactive message', res);
        }); 

        let res = await bot.api.callAPI('/me/messenger_profile', 'delete', {fields: ['persistent_menu']});
        console.log('results of delete menu', res);

        res = await bot.api.callAPI('/me/messenger_profile', 'post', {
            "persistent_menu":[
              {
                "locale":"default",
                "composer_input_disabled": false,
                "call_to_actions":[
                  {
                    "title":"My Account",
                    "type":"nested",
                    "call_to_actions":[
                      {
                        "title":"Pay Bill",
                        "type":"postback",
                        "payload":"PAYBILL_PAYLOAD"
                      },
                      {
                        "type":"web_url",
                        "title":"Latest News",
                        "url":"https://www.messenger.com/",
                        "webview_height_ratio":"full"
                      }
                    ]
                  }
                ]
              }
            ]
          })
          console.log('results of set menu', res);


    });

  }

}