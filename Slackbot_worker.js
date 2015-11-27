var request = require('request');
var ws = require('ws');

module.exports = function(bot,config) {

  var worker = this;
  this.bot = bot;
  this.config = config;


    // create a nice wrapper for the Slack API
    var slack_api = {
        api_url: 'https://slack.com/api/',
        // this is a simple function used to call the slack web API
        callAPI: function(command,options,cb) {
          worker.bot.log('Making an API to ' + command);
          worker.bot.log(worker.config);
          options.token = worker.config.token;
          worker.bot.debug(command,options);
          request.post(this.api_url+command,function (error, response, body) {
           worker.bot.debug('Got response',error,body);
           if (!error && response.statusCode == 200) {
             var json = JSON.parse(body);
             if (json.ok) {
               if (cb) cb(null,json);
             } else {
               if (cb) cb(json.error,json);
             }
           } else {
             if (cb) cb(error);
           }
          }).form(options);
        },
        callAPIWithoutToken: function(command,options,cb) {
          worker.bot.debug(command,options);
          request.post(this.api_url+command,function (error, response, body) {
           worker.bot.debug('Got response',error,body);
           if (!error && response.statusCode == 200) {
             var json = JSON.parse(body);
             if (json.ok) {
               if (cb) cb(null,json);
             } else {
               if (cb) cb(json.error,json);
             }
           } else {
             if (cb) cb(error);
           }
          }).form(options);
        },
        webhooks: {
          send: function(options,cb) {
            if (!worker.config.incoming_webhook || !worker.config.incoming_webhook.url) {
              worker.bot.debug('CANNOT SEND WEBHOOK!!');
              if (cb) cb('No webhook url specified');
            } else {
              request.post(worker.config.incoming_webhook.url,function(err,res,body) {
                  if (err) {
                    worker.bot.debug('WEBHOOK ERROR',err);
                    if (cb) cb(err);
                  } else {
                    worker.bot.debug('WEBHOOK SUCCESS',body);
                    if (cb) cb(null,body);
                  }
              }).form({payload: JSON.stringify(options)});
            }
          }
        },
        auth: {
            test: function(options,cb) {
              slack_api.callAPI('auth.test',options,cb);
            }
        },
        oauth: {
            access: function(options,cb) {
              slack_api.callAPIWithoutToken('oauth.access',options,cb);
            }
        },
        channels: {
          archive: function(options,cb) {
            slack_api.callAPI('channels.archive',options,cb);
          },
          create: function(options,cb) {
            slack_api.callAPI('channels.create',options,cb);
          },
          history: function(options,cb) {
            slack_api.callAPI('channels.history',options,cb);
          },
          info: function(options,cb) {
            slack_api.callAPI('channels.info',options,cb);
          },
          invite: function(options,cb) {
            slack_api.callAPI('channels.invite',options,cb);
          },
          join: function(options,cb) {
            slack_api.callAPI('channels.join',options,cb);
          },
          kick: function(options,cb) {
            slack_api.callAPI('channels.kick',options,cb);
          },
          leave: function(options,cb) {
            slack_api.callAPI('channels.leave',options,cb);
          },
          list: function(options,cb) {
            slack_api.callAPI('channels.list',options,cb);
          },
          mark: function(options,cb) {
            slack_api.callAPI('channels.mark',options,cb);
          },
          rename: function(options,cb) {
            slack_api.callAPI('channels.rename',options,cb);
          },
          setPurpose: function(options,cb) {
            slack_api.callAPI('channels.setPurpose',options,cb);
          },
          setTopic: function(options,cb) {
            slack_api.callAPI('channels.setTopic',options,cb);
          },
          unarchive: function(options,cb) {
            slack_api.callAPI('channels.unarchive',options,cb);
          }
        },
        chat: {
          delete: function(options,cb) {
            slack_api.callAPI('chat.delete',options,cb);
          },
          postMessage: function(options,cb) {
            slack_api.callAPI('chat.postMessage',options,cb);
          },
          update: function(options,cb) {
            slack_api.callAPI('chat.update',options,cb);
          }
        },
        emoji: {
          list: function(options,cb) {
            slack_api.callAPI('emoji.list',options,cb);
          }
        },
        files: {
          delete: function(options,cb) {
            slack_api.callAPI('files.delete',options,cb);
          },
          info: function(options,cb) {
            slack_api.callAPI('files.info',options,cb);
          },
          list: function(options,cb) {
            slack_api.callAPI('files.list',options,cb);
          },
          upload: function(options,cb) {
            slack_api.callAPI('files.upload',options,cb);
          },
        },
        groups: {
          archive: function(options,cb) {
            slack_api.callAPI('groups.archive',options,cb);
          },
          close: function(options,cb) {
            slack_api.callAPI('groups.close',options,cb);
          },
          create: function(options,cb) {
            slack_api.callAPI('groups.create',options,cb);
          },
          createChild: function(options,cb) {
            slack_api.callAPI('groups.createChild',options,cb);
          },
          history: function(options,cb) {
            slack_api.callAPI('groups.history',options,cb);
          },
          info: function(options,cb) {
            slack_api.callAPI('groups.info',options,cb);
          },
          invite: function(options,cb) {
            slack_api.callAPI('groups.invite',options,cb);
          },
          kick: function(options,cb) {
            slack_api.callAPI('groups.kick',options,cb);
          },
          leave: function(options,cb) {
            slack_api.callAPI('groups.leave',options,cb);
          },
          list: function(options,cb) {
            slack_api.callAPI('groups.list',options,cb);
          },
          mark: function(options,cb) {
            slack_api.callAPI('groups.mark',options,cb);
          },
          open: function(options,cb) {
            slack_api.callAPI('groups.open',options,cb);
          },
          rename: function(options,cb) {
            slack_api.callAPI('groups.rename',options,cb);
          },
          setPurpose: function(options,cb) {
            slack_api.callAPI('groups.setPurpose',options,cb);
          },
          setTopic: function(options,cb) {
            slack_api.callAPI('groups.setTopic',options,cb);
          },
          unarchive: function(options,cb) {
            slack_api.callAPI('groups.unarchive',options,cb);
          },
        },
        im: {
          close: function(options,cb) {
            slack_api.callAPI('im.close',options,cb);
          },
          history: function(options,cb) {
            slack_api.callAPI('im.history',options,cb);
          },
          list: function(options,cb) {
            slack_api.callAPI('im.list',options,cb);
          },
          mark: function(options,cb) {
            slack_api.callAPI('im.mark',options,cb);
          },
          open: function(options,cb) {
            slack_api.callAPI('im.open',options,cb);
          }
        },
        reactions: {
          add: function(options,cb) {
            slack_api.callAPI('reactions.add',options,cb);
          },
          get: function(options,cb) {
            slack_api.callAPI('reactions.get',options,cb);
          },
          list: function(options,cb) {
            slack_api.callAPI('reactions.list',options,cb);
          },
          remove: function(options,cb) {
            slack_api.callAPI('reactions.remove',options,cb);
          },
        },
        rtm: {
          start: function(options,cb) {
            slack_api.callAPI('rtm.start',options,cb);
          },
        },
        search: {
          all: function(options,cb) {
            slack_api.callAPI('search.all',options,cb);
          },
          files: function(options,cb) {
            slack_api.callAPI('search.files',options,cb);
          },
          messages: function(options,cb) {
            slack_api.callAPI('search.messages',options,cb);
          },
        },
        stars: {
          list: function(options,cb) {
            slack_api.callAPI('stars.list',options,cb);
          },
        },
        team: {
          accessLogs: function(options,cb) {
            slack_api.callAPI('team.accessLogs',options,cb);
          },
          info: function(options,cb) {
            slack_api.callAPI('team.info',options,cb);
          },
        },
        users: {
          getPresence: function(options,cb) {
            slack_api.callAPI('users.getPresence',options,cb);
          },
          info: function(options,cb) {
            slack_api.callAPI('users.info',options,cb);
          },
          list: function(options,cb) {
            slack_api.callAPI('users.list',options,cb);
          },
          setActive: function(options,cb) {
            slack_api.callAPI('users.setActive',options,cb);
          },
          setPresence: function(options,cb) {
            slack_api.callAPI('users.setPresence',options,cb);
          },
        }
    }

  this.api = slack_api;

    /********************************************************/
    /********************************************************/
    /********************************************************/
    /********************************************************/
    /********************************************************/
    /****** DEALS WITH SENDING AND RECEIVING MESSAGES *******/
    /********************************************************/
    /********************************************************/
    /********************************************************/
    /********************************************************/
    /********************************************************/

    this.closeRTM = function() {

      if (this.rtm) {
        this.rtm.close();
      }
    }

    this.startRTM = function(cb) {

      var self = this;
      this.api.rtm.start({
        no_unreads: true,
        simple_latest: true,
      },function(err,res) {

        if (err) {
          if (cb) {
            cb(err);
          }
        } else if (!res) {
          if (cb) {
            cb('Invalid response from rtm.start');
          }
        } else {
          self.identity = res.self;
          self.team_info = res.team;

          // also available
          // res.users
          // res.channels
          // res.groups
          // res.ims
          // res.bots
          // these could be stored and cached for later use!

          self.bot.log("** BOT ID: ", self.identity.name," ...attempting to connect to RTM!");

          self.rtm = new ws(res.url);
          self.msgcount = 1;

          self.rtm.on('open',function() {
            self.bot.trigger('rtm_open',[this]);

            self.rtm.on('message', function(data, flags) {
              var message = JSON.parse(data);

              // Lets construct a nice quasi-standard botkit message
              // it leaves the main slack message at the root
              // but adds in additional fields for internal use!
              // (including the teams api details)

              message._connection = worker;
             bot.receiveMessage(message,worker);

            });

            if (!self.bot.tickInterval) {

              // set up a once a second tick to process messages
              self.bot.tickInterval = setInterval(function() {
               self.bot.tick();
              },1000);
            }

            if (cb) {
              cb(null,worker,res);
            }

          })

           self.rtm.on('error',function(err) {
             self.bot.log("RTM websocket error!",err)
             self.bot.trigger('rtm_close',[worker,err]);
           });

           self.rtm.on('close',function() {
             self.bot.trigger('rtm_close',[worker]);
           });

         }
       });
    }

    // convenience method for adding user record to message object
    this.lookupMessageUser = function(message,cb) {
      var self = this;
      if (message.user) {
        //bot.useConnection(message._connection);
        self.api.users.info({user: message.user},function(err,res) {

          if (err || !res.ok || !res.user) {
            message._user = {}; // at least return an empty object to avoid undefined references
            cb(err || 'No user found',message);
          } else {
            message._user = res.user;
            cb(null,message);
          }
        })
      } else {
        cb(null,message);
      }

    }

    // convenience method for creating a DM convo
    this.startPrivateConversation = function(message,cb) {
      var self=this;
      self.bot.startTask(message,function(task,convo) {
        self.startDM(task,message.user,function(err,dm) {
          convo.stop();
          cb(err,dm);
        })
      })
    }

    this.startConversation = function(message,cb) {
      this.bot.startConversation(message,cb);
    }

    // convenience method for creating a DM convo
    this.startDM = function(task,user_id,cb) {

      //bot.useConnection(task.connection);
      this.api.im.open({user:user_id},function(err,channel) {
        if (err) {
          cb(err);
        } else {
          cb(null,task.startConversation({channel:channel.channel.id, user: user_id}));
        }
      });
    }

    this.identifyBot = function(message,cb) {
      if (message._connection.identity) {
        this.identifyTeam(message,function(err,team) {
          cb(null,{name: message._connection.identity.name,id:message._connection.identity.id,team_id:team});
        });
      } else {
        // Note: Are there scenarios other than the RTM
        // where we might pull identity info, perhaps from
        // bot.api.auth.test on a given token?
        cb('Identity Unknown: Not using RTM api');
      }
    }

    this.identifyTeam = function(message,cb) {

      // if messages come in as slash commands or outgoing webhooks
      // they include a team_id field
      if (message.team_id) {
        cb(null,message.team_id);
      // otherwise, we should be connected to the RTM
      // in which case we have a bunch of info about the team...
      } else if (message._connection.team_info) {
        cb(null,message._connection.team_info.id);
      }

    }

    this.say = function(connection,message,cb) {
      this.bot.debug('SAY ',message);

      // construct a valid slack message
      var slack_message = {
        id: connection.msgcount++,
        type: 'message',

        channel: message.channel,
        text: message.text,
        username: message.username||null,
        parse: message.parse||null,
        link_names: message.link_names||null,
        attachments: message.attachments?JSON.stringify(message.attachments):null,
        unfurl_links: message.unfurl_links||null,
        unfurl_media: message.unfurl_media||null,
        icon_url: message.icon_url||null,
        icon_emoji: message.icon_emoji||null,
      }

      if (message.icon_url || message.icon_emoji || message.username ){
        slack_message.as_user = false;
      } else {
        slack_message.as_user = message.as_user || true;
      }

      // these options are not supported by the RTM
      // so if they are specified, we use the web API to send messages
      if (message.attachments || message.icon_emoji || message.username || message.icon_url) {
        //bot.useConnection(connection);
        this.api.chat.postMessage(slack_message,function(err,res) {
          if (err) {
            if (cb) { cb(err); }
          } else {
            if (cb) { cb(null,res); }
          }

        });
      } else {
        try {
          connection.rtm.send(JSON.stringify(slack_message),function(err) {
            if (err) {
              // uhoh! RTM had an error sending
              if (cb) { cb(err); }
            } else {
              if (cb) { cb(null); }
            }
          });
        } catch(err) {
          // uhoh! the RTM failed and for some reason it didn't get caught elsewhere.
          // this happens sometimes when the rtm has closed but we are sending messages anyways
          // bot probably needs to reconnect!
          if (cb) { cb(err); }
        }
      }
    }

    this.replyPublic = function(src,resp,cb) {

      if (!src._connection.res) {
        if (cb) { cb('No web response object found'); }
      } else {

        var msg = {};

        if (typeof(resp)=='string') {
            msg.text = resp;
            msg.channel = src.channel;
        } else {
          msg = resp;
          msg.channel = src.channel;
        }

        msg.response_type='in_channel';
        src._connection.res.json(msg);
        if (cb) { cb(null) }
      }

    }

    this.replyPublicDelayed = function(src,resp,cb) {
      var self = this;
      if (!src.response_url) {
        if (cb) { cb('No response_url found'); }
      } else {

        var msg = {};

        if (typeof(resp)=='string') {
            msg.text = resp;
            msg.channel = src.channel;
        } else {
          msg = resp;
          msg.channel = src.channel;
        }

        msg.response_type='in_channel';
        request.post(src.response_url,function(err,resp,body) {
          // do something?
          if (err) {
            self.bot.log('Error sending slash command response:',err);
            if (cb) { cb(err); }
          } else {
            if (cb) { cb(null); }
          }
        }).form(JSON.stringify(msg));
      }

    }

    this.replyPrivate = function(src,resp,cb) {

      if (!src._connection.res) {
        if (cb) { cb('No web response object found'); }
      } else {

        var msg = {};

        if (typeof(resp)=='string') {
            msg.text = resp;
            msg.channel = src.channel;
        } else {
          msg = resp;
          msg.channel = src.channel;
        }

        msg.response_type='ephemeral';
        src._connection.res.json(msg);
        if (cb) { cb(null) }
      }

    }

    this.replyPrivateDelayed = function(src,resp,cb) {

      if (!src.response_url) {
        if (cb) { cb('No response_url found'); }
      } else {

        var msg = {};

        if (typeof(resp)=='string') {
            msg.text = resp;
            msg.channel = src.channel;
        } else {
          msg = resp;
          msg.channel = src.channel;
        }

        msg.response_type='ephemeral';
        request.post(src.response_url,function(err,resp,body) {
          // do something?
          if (err) {
            this.bot.log('Error sending slash command response:',err);
            if (cb) { cb(err) }
          } else {
            if (cb) { cb(null) }
          }
        }).form(JSON.stringify(msg));
      }

    }

    this.reply = function(src,resp,cb) {

      var msg = {};

      if (typeof(resp)=='string') {
          msg.text = resp;
          msg.channel = src.channel;
      } else {
        msg = resp;
        msg.channel = src.channel;
      }

      console.log('say,',msg);

      this.say(src._connection,msg,cb);

    }


    /***

      This handles the particulars of finding an existing conversation or
      topic to fit the message into...

     ***/

    this.findConversation = function(message,cb) {
      var self = this;
      self.bot.debug('CUSTOM FIND CONVO',message.user,message.channel);
      if (message.type=='message' || message.type=='slash_command' || message.type=='outgoing_webhook') {
        for (var t = 0; t < self.bot.tasks.length; t++) {
          for (var c = 0; c < self.bot.tasks[t].convos.length; c++) {
            if (
              self.bot.tasks[t].convos[c].isActive()
              && self.bot.tasks[t].convos[c].source_message.user==message.user
              && self.bot.tasks[t].convos[c].source_message.channel==message.channel
            ) {
              self.bot.debug('FOUND EXISTING CONVO!');
              cb(self.bot.tasks[t].convos[c]);
              return;
            }
          }
        }
      }
      cb(null);

    }


}
