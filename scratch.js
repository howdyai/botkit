var botkit = function(config) {

  this.worker = function(bot,config) {
    this.bot = bot;
    this.config = config;
    this.noop = function() {

    }
    return this;
  }

  this.transcript = [];

  this.tick = function() {


  }

  this.setWorker = function(unit) {
    if (typeof(unit)!='function') {
      throw new Error("Unit of worker must be a constructor function");
    }
    this.worker = worker;
  }

  this.spawn = function(config,cb) {
    var worker = new this.worker(this,config);
    if (cb) { cb(worker); }
    return worker;
  }

  return this;

}

var worker = function(bot,config) {

  this.bot = bot;
  this.config = config;

  this.say = function(msg) {
    console.log(this.config,msg);
    this.bot.transcript.push(msg);
    return this;
  }

  return this;
}


var bot = new botkit();
bot.setWorker(worker);

bot.spawn({token: '123'},function(worker) {
  worker.say("Hello!");
}).say("Woo");


bot.spawn({token: '456'},function(worker) {
  worker.say("Hello!");
})

bot.spawn({token: '789'},function(worker) {
  worker.say("Hello!");
})

console.log(bot.transcript.join("\n"));
