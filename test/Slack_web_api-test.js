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
  t.plan(3);

  controller.on('rtm_open',function(bot) {
    t.ok(bot,'rtm_open fired');
  });

  controller.on('rtm_close',function(bot) {

    t.ok(bot,'disconnected successfully');

    controller.shutdown()
    t.end()

  });

  var bot = controller.spawn(token).startRTM((err, bot, payload)=> {

    if (err) {
      t.fail(err, err)
    }
    else {
      t.ok(bot, 'got the bot')
      console.log(Object.keys(bot))
      bot.closeRTM()

    }

  })
})

test('failed bot properly fails',t=>{

  var controller = Botkit.slackbot({debug:false})
  var bot = controller.spawn('1231').startRTM((err,bot,payload)=>{

    if (err) {
      t.ok(err,'got an error');
      console.log(err);
    } else {
      t.fail('Should have errored!','Should have errored!');
    }
    controller.shutdown();
    t.end();

  });

})
