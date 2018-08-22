var Botkit = require(__dirname + '/CoreBot.js');
const { driver } = require('@rocket.chat/sdk')
const utils = require('./RocketchatUtils')

function RocketChatBot (botkit, config) {
  var controller = Botkit.core(config || {})
  // transform the string value from .env to bool.
  var SSL = (config.rocketchat_ssl === 'true')

  controller.startBot = async () => {
    // implicit call for bot.defineBot()
    var bot = controller.spawn(config)
    try {
      // make the connection with RocketChat
      await driver.connect({ host: config.rocketchat_host, useSsl: SSL })
      await driver.login({ username: config.rocketchat_bot_user, password: config.rocketchat_bot_pass })
      await utils.addToRooms(config.rocketchat_bot_rooms)
      await driver.subscribeToMessages()
      bot.connected = true
    } catch (error) {
      bot.connected = false
      console.log(error)
    }

    if (bot.connected) {
      var options = {
        dm: config.rocketchat_bot_direct_messages,
        livechat: config.rocketchat_bot_live_chat,
        edited: config.rocketchat_bot_edited
      }

      // trigger when every message is sent from any source enabled from
      // options
      driver.respondToMessages(async function (err, message, meta) {
        // store the text from RocketChat incomming messages
        // this message is already normalized.
        // but we might be missing out on fields we want
        message.type = await utils.getRoomType(meta, message, config.rocketchat_bot_mention_rooms, config.rocketchat_bot_user)
        // handle system messages
        message.system = false
        if (message.t !== undefined) {
          message.system = message.t
        } else {
          controller.ingest(bot, message)
        }
      }, options)
    }
  }

  controller.defineBot(function (botkit, config) {
    var bot = {
      type: 'rocketchat',
      botkit: botkit,
      config: config || {},
      utterances: botkit.utterances
    }

    bot.send = async function (message, cb) {
      var newMessage = {
        msg: message.text,
        attachments: message.attachments || []
      }

      if (bot.connected) {
        // handles every type of message
        if (message.type === 'direct_message') {
          await driver.sendDirectToUser(newMessage, message.user)
        } else if (message.type === 'live_chat') {
          await driver.sendToRoomId(newMessage, message.channel)
        } else if (message.type === 'mention') {
          await driver.sendToRoomId(newMessage, message.channel)
        } else if (message.type === 'channel') {
          await driver.sendToRoomId(newMessage, message.channel)
        } else if (message.type === 'message') {
          await driver.sendToRoomId(newMessage, message.channel)
        }
        cb()
      }
      // BOT is not connected
      cb()
    }

    bot.reply = function (src, resp, cb) {
      if (typeof (resp) === 'string') {
        resp = {
          text: resp
        }
      }
      resp.type = src.type
      resp.user = src.user
      resp.channel = src.channel
      bot.say(resp, cb)
    }

    // this function defines the mechanism by which botkit looks for ongoing conversations
    // probably leave as is!
    bot.findConversation = function (message, cb) {
      for (var t = 0; t < botkit.tasks.length; t++) {
        for (var c = 0; c < botkit.tasks[t].convos.length; c++) {
          if (
            botkit.tasks[t].convos[c].isActive() &&
                        botkit.tasks[t].convos[c].source_message.user === message.user &&
                        botkit.tasks[t].convos[c].source_message.channel === message.channel &&
                        botkit.excludedEvents.indexOf(message.type) === -1 // this type of message should not be included
          ) {
            cb(botkit.tasks[t].convos[c])
            return
          }
        }
      }
      cb()
    }
    return bot
  })

  // Add callMethod to controller object
  function callMethod(method, ...args) {
    return driver.callMethod(method, ...args)
  }
  controller.callMethod = callMethod

  //controller.prototype.callMethod = callMethod
  // Esse modulo eh usado em outro.. serve como uma lib. aqui ja tem o obj "controller" porem eu quero
  // add uma funcao (callMethod) nesse obj (controller) pra usar ele no app (controller.callMethod)

  // Verify the pipeline of the message, using for debug
  controller.middleware.receive.use(function (bot, message, next) { console.log('I RECEIVED', message); next() })
  controller.middleware.send.use(function (bot, message, next) { console.log('I AM SENDING', message); next() })

  // provide one or more normalize middleware functions that take a raw incoming message
  // and ensure that the key botkit fields are present -- user, channel, text, and type
  controller.middleware.normalize.use(function (bot, message, next) {
    message.text = utils.handleMention(message, config.rocketchat_bot_user)
    message.user = message.u.username
    message.channel = message.rid
    message.ts = message.ts.$date
    next()
  })

  controller.middleware.categorize.use(function (bot, message, next) {
    next()
  })

  // provide one or more ways to format outgoing messages from botkit messages into
  // the necessary format required by the platform API
  // at a minimum, copy all fields from `message` to `platformMessage`
  controller.middleware.format.use(function (bot, message, platformMessage, next) {
    for (var k in message) {
      platformMessage[k] = message[k]
    }
    if (!platformMessage.type) {
      platformMessage.type = 'message'
    }
    next()
  })

  return controller
}

module.exports = RocketChatBot
