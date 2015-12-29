var test = require('tape')
var Botkit = require('../')
var env = require('node-env-file')
var path = require('path')

env(path.join(__dirname, '..', '.env'))
var token = {token:process.env.TOKEN}

test('sanity', t=> {
  t.plan(4)
  t.ok(token, '.env sets TOKEN')
  console.log(token)
  t.ok(Botkit, 'Botkit exists')
  t.ok(Botkit.core, 'Botkit.core exists')
  t.ok(Botkit.slackbot, 'Botkit.slackbot exists')
  console.log(Botkit)
})

test('can start and then stop a bot', t=> {

  var controller = Botkit.slackbot({debug:false})
  var bot = controller.spawn(token).startRTM((err, bot, payload)=> {

    if (err) {
      t.fail(err, err)
    }
    else {
      t.ok(bot, 'got the bot')
      console.log(Object.keys(bot))
    }

    // does not exit!
    bot.rtm.terminate()
    bot.closeRTM()
    controller.shutdown()

    t.end()
  })
})
