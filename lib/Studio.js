// var _STUDIO_COMMAND_API = 'http://ren:stimpy@happynetbox.com';
// var _STUDIO_STATS_API = 'http://ren:stimpy@happynetbox.com';

var _STUDIO_COMMAND_API = 'http://192.168.33.19';
var _STUDIO_STATS_API = 'http://192.168.33.19';

var request = require('request');
var Promise = require('promise');
var md5 = require('md5');

module.exports = function(studio){
  var before_hooks = {};
  var after_hooks = {};
  var answer_hooks = {};

  function studioAPI(bot,options){
    return new Promise(function(resolve, reject){
      var headers = {
          'content-type': 'application/json',
      };
      if (bot.config.howdy_token) {
          console.log('Using authenticated session');
          options.uri = options.uri + '?access_token=' + bot.config.howdy_token;
          //    options.headers.session = JSON.stringify(howdy_session);
      } else if (studio.config.howdy_token) {
          console.log('Using shared authenticated session');
          options.uri = options.uri + '?access_token=' + studio.config.howdy_token;
      }else {
        throw new Error('No Botkit Studio Token');
      }
      options.headers = headers;
      request(options, function(err,res,body) {
          if (err) {
              console.log('Rejecting because of error!',err);
              return reject(err);
          }
          try{
            json = JSON.parse(body);
            if (json.error) {
                console.log('Rejecting because JSON error', json.error);
                reject(json.error);
            } else {
                resolve(json);
            }
          }
          catch(e) {
            console.log('Rejecting because JSON error', e);
            return reject('Invalid JSON');
          }
      });
    }).catch(function(err) {
        reject(err);
    });
  }

  function statsAPI(bot,options){
    // console.log('------------------------------------statsAPI------------------------------------------------');
    // console.log('options: ', options);
    return new Promise(function(resolve, reject){
      var headers = {
          'content-type': 'application/json',
      };
      if (bot.config.howdy_token) {
          console.log('Using authenticated session');
          options.uri = options.uri + '?access_token=' + bot.config.howdy_token;
          //    options.headers.session = JSON.stringify(howdy_session);
      } else if (studio.config.howdy_token) {
          console.log('Using shared authenticated session');
          options.uri = options.uri + '?access_token=' + studio.config.howdy_token;
      }else {
        console.log('Unathenticated request');
      }
      options.headers = headers;
      var now = new Date();
      if (options.now) {
          now = options.now;
      }
      var stats_body = {};
      stats_body.botHash = studio.botHash(bot.team_info.id, bot.identity.id);
      stats_body.team = md5(bot.team_info.id);
      stats_body.channel = options.form.channel;
      stats_body.user = options.form.user;
      stats_body.type = options.form.type;
      stats_body.time = now;
      stats_body.meta = {};
      stats_body.meta.user = options.form.user;
      stats_body.meta.channel = options.form.channel;
      stats_body.meta.timestamp = options.form.timestamp;
      stats_body.meta.conversation_length = options.form.conversation_length;
      stats_body.meta.status = options.form.status;
      stats_body.meta.type = options.form.type;
      stats_body.meta.command = options.form.command;
      options.form = stats_body;
      stats_body.meta.timestamp = options.now || now;
      request(options, function(err,res,body) {
          if (err) {
              console.log('Rejecting because of error!',err);
              return reject(err);
          }
          try{
            json = JSON.parse(body);
            if (json.error) {
                console.log('Rejecting because JSON error', json.error);
                reject(json.error);
            } else {
              // console.log('json: ', json);
              resolve(json);
            }
          }
          catch(e) {
            console.log('Rejecting because JSON error', e);
            return reject('Invalid JSON');
          }
      });
    }).catch(function(err) {
        reject(err);
    });
  }

  studio.botHash = function(team, bot_id){
    var x = md5(team + '|' + bot_id);
    return x;
  };

  studio.evaluateTrigger = function(bot,text) {
      var url = _STUDIO_COMMAND_API + '/api/v1/commands/triggers';
      return studioAPI(bot, {
          uri: url,
          method: 'post',
          form: {triggers: text},
      });
  };

  // load a script from the pro service
  studio.get = function(bot,text) {
      var url = _STUDIO_COMMAND_API + '/api/v1/commands/name';
      return studioAPI(bot, {
          uri: url,
          method: 'post',
          form: {command: text},
      });
  };

  studio.getScripts = function(bot,text) {
      var url = _STUDIO_COMMAND_API + '/api/v1/commands/name';
      return studioAPI(bot, {
          uri: url,
          method: 'post',
          form: {command: text},
      });
  };


  studio.validate = function(command_name, key, func) {

      if (!answer_hooks[command_name]) {
          answer_hooks[command_name] = [];

      }
      if (key && !answer_hooks[command_name][key]) {
          answer_hooks[command_name][key] = [];
          answer_hooks[command_name][key].push(func);
      }


      return studio;
  };

  studio.before = function(command_name, func) {

      if (!before_hooks[command_name]) {
          before_hooks[command_name] = [];
      }

      before_hooks[command_name].push(func);

      return studio;
  };


  studio.after = function(command_name, func) {

      if (!after_hooks[command_name]) {
          after_hooks[command_name] = [];
      }

      after_hooks[command_name].push(func);

      return studio;

  };

  studio.runHooks = function(hooks, convo, cb) {

      if (!hooks || !hooks.length) {
          return cb(convo);
      }

      var func = hooks.shift();

      func(convo, function() {
          if (hooks.length) {
              studio.runHooks(hooks, convo, cb);
          } else {
              return cb(convo);
          }
      });
  };

  studio.run = function(bot, message) {
      return new Promise(function(resolve,reject) {
          studio.get(bot, message.text).then(function(command) {
              studio.trigger('remote_command', [bot, message, command]);
              studio.trigger('command_triggered', [bot, message, command]);
                studio.compileScript(bot, message, command.command, command.script, command.variables).then(function(convo) {
                    convo.on('end', function(convo) {
                        studio.runHooks(after_hooks[command.command]?after_hooks[command.command].slice():[], convo, function(convo) {
                            studio.trigger('remote_command_end', [bot, message, command, convo]);
                        });
                    });
                    studio.runHooks(before_hooks[command.command]?before_hooks[command.command].slice():[], convo, function(convo) {
                        convo.activate();
                        resolve(convo);
                    });
                }).catch(function(err) {
                    reject(err);
                });

          });
      });
  };




  studio.runTrigger = function(bot, message) {
      return new Promise(function(resolve,reject) {
          studio.evaluateTrigger(bot, message.text).then(function(command) {
              if (command !== {} && command.id) {
                studio.trigger('remote_command', [bot, message, command]);
                studio.trigger('command_triggered', [bot, message, command]);
                  studio.compileScript(bot, message, command.command, command.script, command.variables).then(function(convo) {

                      convo.on('end', function(convo) {
                          studio.runHooks(after_hooks[command.command]?after_hooks[command.command].slice():[], convo, function(convo) {
                              studio.trigger('remote_command_end', [bot, message, command, convo]);
                              resolve(convo);
                          });
                      });

                      studio.runHooks(before_hooks[command.command]?before_hooks[command.command].slice():[], convo, function(convo) {
                              convo.activate();
                      });
                  }).catch(function(err) {
                      reject(err);
                  });
              } else {
                  // do nothing
              }
          }).catch(function(err) {
              reject(err);
          });
      });

  };

  studio.compileScript = function(bot, message, command_name, topics, vars) {
      function makeHandler(options, field) {
          var pattern = '';

          if (options.type == 'utterance') {
              pattern = studio.utterances[options.pattern];
          } else {
              pattern = '^' + options.pattern + '$';
          }

          return {
              pattern: pattern,
              default: options.default,
              callback: function(response, convo) {
                      var hooks = [];
                      if (field.key && answer_hooks[command_name] && answer_hooks[command_name][field.key]) {
                          hooks = answer_hooks[command_name][field.key].slice();
                      }
                      if (options.action != 'wait' && field.multiple) {
                          convo.responses[field.key].pop();
                      }

                      studio.runHooks(hooks, convo, function(convo) {
                          switch (options.action) {
                              case 'next':
                                  convo.next();
                                  break;
                              case 'repeat':
                                  convo.repeat();
                                  convo.next();
                                  break;
                              case 'stop':
                                  convo.stop();
                                  break;
                              case 'wait':
                                  convo.silentRepeat();
                                  break;
                              default:
                                  convo.changeTopic(options.action);
                                  break;
                          }
                      });
              }
          };

      }

      return new Promise(function(resolve,reject) {
          bot.createConversation(message, function(err, convo) {

              convo.setTimeout(studio.config.default_timeout || (15 * 60 * 1000));  // 15 minute default timeout
              if (err) { return reject(err); }
                  for (var t=0; t < topics.length; t++) {
                      var topic = topics[t].topic;
                      for (var m = 0; m < topics[t].script.length; m++) {

                          var message = {
                          };

                          if (topics[t].script[m].text) {
                              message.text = topics[t].script[m].text;
                          }
                          if (topics[t].script[m].attachments) {
                              message.attachments = topics[t].script[m].attachments;


                              // enable mrkdwn formatting in all fields of the attachment
                              for (var a = 0; a < message.attachments.length; a++) {
                                message.attachments[a].mrkdwn_in = ['text', 'pretext', 'fields'];
                                message.attachments[a].mrkdwn = true;
                              }
                          }

                          if (topics[t].script[m].action) {
                              message.action = topics[t].script[m].action;
                          }

                          if (topics[t].script[m].collect) {
                              // this is a question message
                              var capture_options = {};
                              var handlers = [];
                              var options = topics[t].script[m].collect.options || [];
                              if (topics[t].script[m].collect.key) {
                                  capture_options.key = topics[t].script[m].collect.key;
                              }

                              if (topics[t].script[m].collect.multiple) {
                                  capture_options.multiple = true;
                              }

                              var default_found = false;
                              for (var o = 0; o < options.length; o++) {
                                  var handler = makeHandler(options[o],capture_options);
                                  handlers.push(handler);
                                  if (options[o].default) {
                                      default_found = true;
                                  }
                              }

                              // make sure there is a default
                              if (!default_found) {
                                  handlers.push({
                                      default: true,
                                      callback: function(r,c) {

                                          studio.runHooks(answer_hooks[command_name]?answer_hooks[command_name].slice():[], convo, function(convo) {
                                              c.next();
                                          });
                                      }
                                  });
                              }

                              convo.addQuestion(message,handlers,capture_options,topic);

                          } else {

                              // this is a simple message
                              convo.addMessage(message,topic);
                          }
                      }
                  }
              resolve(convo);
          });
      });
  };


  studio.on('message_received', function(bot, message) {
    studio.trigger('stats_message_received', message);
  });

  studio.on('sent', function(bot, message) {
    // console.log('sent /////////////////////////////////////');
    var data = {
      user: md5(message.user),
      channel: md5(message.channel)
    };
    studio.trigger('stats_sent', message);
    // var url = _STUDIO_STATS_API + '/api/v1/stats';
    // return statsAPI(bot, {
    //     uri: url,
    //     method: 'post',
    //     form: data,
    // });
  });

  studio.on('spawned', function(bot) {
      // console.log('bot spawned /////////////////////////////////////');
    var data = {
      user: md5(bot.identity.id),
      channel: null
    };
    studio.trigger('stats_spawned', bot);
    var url = _STUDIO_STATS_API + '/api/v1/stats';
    return statsAPI(bot, {
        uri: url,
        method: 'post',
        form: data,
    });
  });

  studio.on('conversationStarted', function(bot, convo) {
    // console.log('conversationStarted /////////////////////////////////////');
    var data = {
      typ: 'conversationStart',
      user: md5(convo.source_message.user),
      channel: md5(convo.source_message.channel)
    };
    studio.trigger('stats_conversationStarted', convo);
    var url = _STUDIO_STATS_API + '/api/v1/stats';
    return statsAPI(bot, {
        uri: url,
        method: 'post',
        form: data,
    });
  });

  studio.on('conversationEnded', function(bot, convo) {
    // console.log('conversationEnded /////////////////////////////////////');
    var data = {
      type: 'conversationEnd',
      user: md5(convo.source_message.user),
      channel: md5(convo.source_message.channel),
      conversation_length: convo.lastActive - convo.startTime
    };
    studio.trigger('stats_conversationEnded', convo);
    var url = _STUDIO_STATS_API + '/api/v1/stats';
    return statsAPI(bot, {
        uri: url,
        method: 'post',
        form: data,
    });
  });

  studio.on('command_triggered', function(bot, message, command) {
    // console.log('command_triggered /////////////////////////////////////');
    var data = {
      type: 'command_triggered',
      now: message.now,
      user: md5(message.user),
      channel: md5(message.channel),
      command: command.command,
      timestamp: command.created
    };
    studio.trigger('stats_command_triggered', message);
    var url = _STUDIO_STATS_API + '/api/v1/stats';
    return statsAPI(bot, {
        uri: url,
        method: 'post',
        form: data,
    });
  });

  studio.on('remote_command_end', function(bot, message, command, convo){
    // console.log('remote_command_end /////////////////////////////////////////////////////');
    var data = {
      now: message.now,
      user: md5(message.user),
      channel: md5(message.channel),
      command: command.command,
      timestamp: command.created,
      conversation_length: convo.lastActive - convo.startTime,
      status: convo.status,
      type: 'remote_command_end'
    };
    studio.trigger('stats_remote_command_end', message);
    var url = _STUDIO_STATS_API + '/api/v1/stats';
    return statsAPI(bot, {
        uri: url,
        method: 'post',
        form: data,
    });

  });

  studio.on('heard_trigger', function(bot, keywords, message) {
    // console.log('heard_trigger /////////////////////////////////////');
    var data = {
      type: 'heard_trigger',
      user: md5(message.user),
      channel: md5(message.channel),
      meta: {
        command: 'command.command',
        timestamp: 'command.created'
      }
    };
    studio.trigger('stats_heard_trigger', message);
    var url = _STUDIO_STATS_API + '/api/v1/stats';
    return statsAPI(bot, {
        uri: url,
        method: 'post',
        form: data,
    });
  });

};
