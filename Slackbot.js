var Bot = require('./Bot.js');
var request = require('request');
var ws = require('ws');
var fs = require('fs');
var express = require('express'),
    bodyParser = require("body-parser");


function Slackbot(configuration) {

  // Create a core botkit bot
  var bot = Bot(configuration||{});


  /********************************************************/
  /********************************************************/
  /********************************************************/
  /********************************************************/
  /********************************************************/
  /****** DEALS WITH CONNECTIONS TO SLACK API *************/
  /********************************************************/
  /********************************************************/
  /********************************************************/
  /********************************************************/
  /********************************************************/



  // create a nice wrapper for the Slack API
  bot.api = {
      api_url: 'https://slack.com/api/',
      // this is a simple function used to call the slack web API
      callAPI: function(command,options,cb) {
        options.token = bot.config.token;
        bot.debug(command,options);
        request.post(this.api_url+command,function (error, response, body) {
         bot.debug('Got response',error,body);
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
        bot.debug(command,options);
        request.post(this.api_url+command,function (error, response, body) {
         bot.debug('Got response',error,body);
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
          if (!bot.config.incoming_webhook || !bot.config.incoming_webhook.url) {
            bot.debug('CANNOT SEND WEBHOOK!!');
            if (cb) cb('No webhook url specified');
          } else {
            request.post(bot.config.incoming_webhook.url,function(err,res,body) {
                if (err) {
                  bot.debug('WEBHOOK ERROR',err);
                  if (cb) cb(err);
                } else {
                  bot.debug('WEBHOOK SUCCESS',body);
                  if (cb) cb(null,body);
                }
            }).form({payload: JSON.stringify(options)});
          }
        }
      },
      auth: {
          test: function(options,cb) {
            bot.api.callAPI('auth.test',options,cb);
          }
      },
      oauth: {
          access: function(options,cb) {
            bot.api.callAPIWithoutToken('oauth.access',options,cb);
          }
      },
      channels: {
        archive: function(options,cb) {
          bot.api.callAPI('channels.archive',options,cb);
        },
        create: function(options,cb) {
          bot.api.callAPI('channels.create',options,cb);
        },
        history: function(options,cb) {
          bot.api.callAPI('channels.history',options,cb);
        },
        info: function(options,cb) {
          bot.api.callAPI('channels.info',options,cb);
        },
        invite: function(options,cb) {
          bot.api.callAPI('channels.invite',options,cb);
        },
        join: function(options,cb) {
          bot.api.callAPI('channels.join',options,cb);
        },
        kick: function(options,cb) {
          bot.api.callAPI('channels.kick',options,cb);
        },
        leave: function(options,cb) {
          bot.api.callAPI('channels.leave',options,cb);
        },
        list: function(options,cb) {
          bot.api.callAPI('channels.list',options,cb);
        },
        mark: function(options,cb) {
          bot.api.callAPI('channels.mark',options,cb);
        },
        rename: function(options,cb) {
          bot.api.callAPI('channels.rename',options,cb);
        },
        setPurpose: function(options,cb) {
          bot.api.callAPI('channels.setPurpose',options,cb);
        },
        setTopic: function(options,cb) {
          bot.api.callAPI('channels.setTopic',options,cb);
        },
        unarchive: function(options,cb) {
          bot.api.callAPI('channels.unarchive',options,cb);
        }
      },
      chat: {
        delete: function(options,cb) {
          bot.api.callAPI('chat.delete',options,cb);
        },
        postMessage: function(options,cb) {
          bot.api.callAPI('chat.postMessage',options,cb);
        },
        update: function(options,cb) {
          bot.api.callAPI('chat.update',options,cb);
        }
      },
      emoji: {
        list: function(options,cb) {
          bot.api.callAPI('emoji.list',options,cb);
        }
      },
      files: {
        delete: function(options,cb) {
          bot.api.callAPI('files.delete',options,cb);
        },
        info: function(options,cb) {
          bot.api.callAPI('files.info',options,cb);
        },
        list: function(options,cb) {
          bot.api.callAPI('files.list',options,cb);
        },
        upload: function(options,cb) {
          bot.api.callAPI('files.upload',options,cb);
        },
      },
      groups: {
        archive: function(options,cb) {
          bot.api.callAPI('groups.archive',options,cb);
        },
        close: function(options,cb) {
          bot.api.callAPI('groups.close',options,cb);
        },
        create: function(options,cb) {
          bot.api.callAPI('groups.create',options,cb);
        },
        createChild: function(options,cb) {
          bot.api.callAPI('groups.createChild',options,cb);
        },
        history: function(options,cb) {
          bot.api.callAPI('groups.history',options,cb);
        },
        info: function(options,cb) {
          bot.api.callAPI('groups.info',options,cb);
        },
        invite: function(options,cb) {
          bot.api.callAPI('groups.invite',options,cb);
        },
        kick: function(options,cb) {
          bot.api.callAPI('groups.kick',options,cb);
        },
        leave: function(options,cb) {
          bot.api.callAPI('groups.leave',options,cb);
        },
        list: function(options,cb) {
          bot.api.callAPI('groups.list',options,cb);
        },
        mark: function(options,cb) {
          bot.api.callAPI('groups.mark',options,cb);
        },
        open: function(options,cb) {
          bot.api.callAPI('groups.open',options,cb);
        },
        rename: function(options,cb) {
          bot.api.callAPI('groups.rename',options,cb);
        },
        setPurpose: function(options,cb) {
          bot.api.callAPI('groups.setPurpose',options,cb);
        },
        setTopic: function(options,cb) {
          bot.api.callAPI('groups.setTopic',options,cb);
        },
        unarchive: function(options,cb) {
          bot.api.callAPI('groups.unarchive',options,cb);
        },
      },
      im: {
        close: function(options,cb) {
          bot.api.callAPI('im.close',options,cb);
        },
        history: function(options,cb) {
          bot.api.callAPI('im.history',options,cb);
        },
        list: function(options,cb) {
          bot.api.callAPI('im.list',options,cb);
        },
        mark: function(options,cb) {
          bot.api.callAPI('im.mark',options,cb);
        },
        open: function(options,cb) {
          bot.api.callAPI('im.open',options,cb);
        }
      },
      reactions: {
        add: function(options,cb) {
          bot.api.callAPI('reactions.add',options,cb);
        },
        get: function(options,cb) {
          bot.api.callAPI('reactions.get',options,cb);
        },
        list: function(options,cb) {
          bot.api.callAPI('reactions.list',options,cb);
        },
        remove: function(options,cb) {
          bot.api.callAPI('reactions.remove',options,cb);
        },
      },
      rtm: {
        start: function(options,cb) {
          bot.api.callAPI('rtm.start',options,cb);
        },
      },
      search: {
        all: function(options,cb) {
          bot.api.callAPI('search.all',options,cb);
        },
        files: function(options,cb) {
          bot.api.callAPI('search.files',options,cb);
        },
        messages: function(options,cb) {
          bot.api.callAPI('search.messages',options,cb);
        },
      },
      stars: {
        list: function(options,cb) {
          bot.api.callAPI('stars.list',options,cb);
        },
      },
      team: {
        accessLogs: function(options,cb) {
          bot.api.callAPI('team.accessLogs',options,cb);
        },
        info: function(options,cb) {
          bot.api.callAPI('team.info',options,cb);
        },
      },
      users: {
        getPresence: function(options,cb) {
          bot.api.callAPI('users.getPresence',options,cb);
        },
        info: function(options,cb) {
          bot.api.callAPI('users.info',options,cb);
        },
        list: function(options,cb) {
          bot.api.callAPI('users.list',options,cb);
        },
        setActive: function(options,cb) {
          bot.api.callAPI('users.setActive',options,cb);
        },
        setPresence: function(options,cb) {
          bot.api.callAPI('users.setPresence',options,cb);
        },
      }
  }

  // set up API to send incoming webhook
  bot.configureIncomingWebhook = function(options) {

    if (!options.url) {
      throw new Error('No incoming webhook URL specified!');
    }

    bot.config.incoming_webhook = options;

  }

  // set up configuration for oauth
  // slack_app_config should contain
  // { clientId, clientSecret, scopes}
  // https://api.slack.com/docs/oauth-scopes
  bot.configureSlackApp = function(slack_app_config,cb) {

    bot.log('** Configuring app as a Slack App!');
    if (!slack_app_config || !slack_app_config.clientId || !slack_app_config.clientSecret || !slack_app_config.scopes) {
      throw new Error('Missing oauth config details',bot);
    } else {
      bot.config.clientId = slack_app_config.clientId;
      bot.config.clientSecret = slack_app_config.clientSecret;
      if (typeof(slack_app_config.scopes)=='string') {
        bot.config.scopes = slack_app_config.scopes.split(/\,/);
      } else {
        bot.config.scopes = slack_app_config.scopes;
      }
      if (cb) cb(null,bot);
    }

    return bot;

  }

  // use a specific slack API token
  bot.useToken = function(token,cb) {
    bot.config.token = token;
    if (cb) { cb(); }
    return bot;
  }

  bot.useConnection = function(connection) {

    if (connection.team.token) {
      bot.useToken(connection.team.token);
    }

    if (connection.team.incoming_webhook) {
      bot.configureIncomingWebhook(connection.team.incoming_webhook);
    }

  }

  // set up a web route that is a landing page
  bot.createHomepageEndpoint = function(webserver) {

    bot.log('** Serving app landing page at : http://MY_HOST:' + bot.config.port + '/');

    // FIX THIS!!!
    // this is obvs not right.
    webserver.get('/',function(req,res) {

      res.send('Howdy!');

    });

    return bot;

  }

  // set up a web route for receiving outgoing webhooks and/or slash commands
  bot.createWebhookEndpoints = function(webserver) {

    bot.log('** Serving webhook endpoints for Slash commands and outgoing webhooks at: http://MY_HOST:' + bot.config.port + '/slack/receive');
    webserver.post('/slack/receive',function(req,res) {

      // this is a slash command
      if (req.body.command) {
        var message = {};

        for (var key in req.body) {
          message[key] = req.body[key];
        }

        // let's normalize some of these fields to match the rtm message format
        message.user = message.user_id;
        message.channel = message.channel_id;

        bot.findTeamById(message.team_id,function(err,team) {

          if (err || !team) {
            bot.log('Received slash command, but could not load team');

          } else {
            message.type='slash_command';
            // HEY THERE
            // Slash commands can actually just send back a response
            // and have it displayed privately. That means
            // the callback needs access to the res object
            // to send an optional response.

            res.status(200);
            var connection = {
              team: team,
              res: res,
            }
            message._connection = connection;

            bot.receiveMessage(message);

          }
        });

      } else if (req.body.trigger_word) {

        var message = {};

        for (var key in req.body) {
          message[key] = req.body[key];
        }

        // let's normalize some of these fields to match the rtm message format
        message.user = message.user_id;
        message.channel = message.channel_id;

        bot.findTeamById(message.team_id,function(err,team) {

          if (err || !team) {
            bot.log('Received outgoing webhook but could not load team');
          } else {
            message.type='outgoing_webhook';
            var connection = {
              team: team,
              res: res,
            }

            res.status(200);
            message._connection = connection;

            bot.receiveMessage(message);

            // outgoing webhooks are also different. They can simply return
            // a response instead of using the API to reply.  Maybe this is
            // a different type of event!!

            //res.send('');
          }
        });

      }

    })

    return bot;
  }

  bot.saveTeam = function(team,cb) {

    bot.storage.teams.save(team,cb);

  }

  // look up a team's memory and configuration and return it, or
  // return an error!
  bot.findTeamById = function(id,cb) {

    bot.storage.teams.get(id,cb);

  }

  bot.setupWebserver = function(port,cb) {

    if (!port) {
      throw new Error("Cannot start webserver without a port");
    }
    if (isNaN(port)) {
      throw new Error("Specified port is not a valid number");
    }

    bot.config.port = port;

    bot.webserver = express();
    bot.webserver.use(bodyParser.json());
    bot.webserver.use(bodyParser.urlencoded({ extended: true }));
    bot.webserver.use(express.static(__dirname + '/public'));

    var server = bot.webserver.listen(bot.config.port, function () {
      bot.log('** Starting webserver on port ' + bot.config.port);
      if (cb) { cb(null,bot.webserver); }
    });

    return bot;

  }

  // get a team url to redirect the user through oauth process
  bot.getAuthorizeURL = function(team_id) {

    var url = 'https://slack.com/oauth/authorize';
    var scopes = bot.config.scopes;
    url = url + "?client_id=" + bot.config.clientId + "&scope=" + scopes.join(",") + "&state=botkit"

    if (team_id) {
      url = url + "&team=" + team_id;
    }
    if (bot.config.redirect_uri) {
      url = url + "&redirect_uri="+redirect_uri;
    }

    return url;

  }

  // set up a web route for redirecting users
  // and collecting authentication details
  // https://api.slack.com/docs/oauth
  // https://api.slack.com/docs/oauth-scopes
  bot.createOauthEndpoints = function(webserver,callback) {

    bot.log('** Serving login URL: http://MY_HOST:' + bot.config.port + '/login');

    if (!bot.config.clientId) {
      throw new Error('Cannot create oauth endpoints without calling configureSlackApp() with a clientId first');
    }
    if (!bot.config.clientSecret) {
      throw new Error('Cannot create oauth endpoints without calling configureSlackApp() with a clientSecret first');
    }
    if (!bot.config.scopes) {
      throw new Error('Cannot create oauth endpoints without calling configureSlackApp() with a list of scopes first');
    }

    webserver.get('/login',function(req,res) {

        res.redirect(bot.getAuthorizeURL())

    });


    bot.log('** Serving oauth return endpoint: http://MY_HOST:' + bot.config.port + '/oauth');

    webserver.get('/oauth',function(req,res) {

      var code = req.query.code;
      var state = req.query.state;

      bot.api.oauth.access({
        client_id: bot.config.clientId,
        client_secret: bot.config.clientSecret,
        code: code
      },function(err,auth) {

        if (err) {
          if (callback) {
            callback(err,req,res);
          } else {
            res.status(500).send(err);
          }
          bot.trigger('oauth_error',[err]);
        } else {

          // auth contains at least:
          // { access_token, scope, team_name}
          // May also contain:
          // { team_id } (not in incoming_webhook scope)
          // info about incoming webhooks:
          // { incoming_webhook: { url, channel, configuration_url} }
          // might also include slash commands:
          // { commands: ??}

          // what scopes did we get approved for?
          var scopes = auth.scope.split(/\,/);

          // temporarily use the token we got from the oauth
          // we need to call auth.test to make sure the token is valid
          // but also so that we reliably have the team_id field!
          bot.config.token = auth.access_token;
          bot.api.auth.test({},function(err,identity) {

            if (err) {
              if (callback) {
                callback(err,req,res);
              } else {
                res.status(500).send(err);
              }

              bot.trigger('oauth_error',[err]);

            } else {

              bot.findTeamById(identity.team_id,function(err,team) {

                // define the connection to this team
                var connection = {};
                if (team) {
                  connection = {
                    team: team
                  }
                } else {
                  connection = {
                    team: {
                      id: identity.team_id,
                      createdBy: identity.user_id,
                      team_url: identity.url,
                      team_name: identity.team,
                    }
                  }
                }

                if (auth.incoming_webhook) {
                  auth.incoming_webhook.token = auth.access_token;
                  auth.incoming_webhook.createdBy = identity.user_id;
                  connection.team.incoming_webhook = auth.incoming_webhook;
                  bot.trigger('create_incoming_webhook',[connection,connection.team.incoming_webhook]);
                }

                bot.saveTeam(connection.team,function(err,id) {
                  if (err) {
                    bot.log('An error occurred while saving a team: ',err);
                    if (callback) {
                      callback(err,req,res);
                    } else {
                      res.status(500).send(err);
                    }
                    bot.trigger('error',[err]);
                  } else {
                    if (callback) {
                      callback(null,req,res);
                    } else {
                      res.redirect('/');
                    }
                  }
                });

              });
            }
          })

        }

      });

    });

    return bot;

  }

  bot.handleSlackEvents = function() {

    bot.log('** Setting up custom handlers for processing Slack messages');
    bot.on('message_received',function(message) {

      if (message.ok!=undefined) {
        // this is a confirmation of something we sent.
        return false;
      }

      bot.debug('DEFAULT SLACK MSG RECEIVED RESPONDER');
      if ('message' == message.type) {

        if (message.text) {
          message.text = message.text.trim();
        }

        // set up a couple of special cases based on subtype
        if (message.subtype && message.subtype=='channel_join') {
          // someone joined. maybe do something?
          if (message.user==message._connection.identity.id) {
            bot.trigger('bot_channel_join',[message]);
            return false;
          } else {
            bot.trigger('user_channel_join',[message]);
            return false;
          }
        } else if (message.subtype && message.subtype == 'group_join') {
          // someone joined. maybe do something?
          if (message.user==message._connection.identity.id) {
            bot.trigger('bot_group_join',[message]);
            return false;
          } else {
            bot.trigger('user_group_join',[message]);
            return false;
          }

        } else if (message.subtype) {
          bot.trigger(message.subtype,[message]);
          return false;

        } else if (message.channel.match(/^D/)){
          // this is a direct message
          if (message.user==message._connection.identity.id) {
            return false;
          }

          if (!message.text) {
            // message without text is probably an edit
            return false;
          }

          // remove direct mention so the handler doesn't have to deal with it
          var direct_mention = new RegExp('^\<\@' + message._connection.identity.id + '\>','i');
          message.text = message.text.replace(direct_mention,'').replace(/^\s+/,'').replace(/^\:\s+/,'').replace(/^\s+/,'');

          message.event = 'direct_message';

          bot.trigger('direct_message',[message]);
          return false;

        } else {
          if (message.user==message._connection.identity.id) {
            return false;
          }
          if (!message.text) {
            // message without text is probably an edit
            return false;
          }

          var direct_mention = new RegExp('^\<\@' + message._connection.identity.id + '\>','i');
          var mention = new RegExp('\<\@' + message._connection.identity.id + '\>','i');

          if (message.text.match(direct_mention)) {
            // this is a direct mention
            message.text = message.text.replace(direct_mention,'').replace(/^\s+/,'').replace(/^\:\s+/,'').replace(/^\s+/,'');
            message.event = 'direct_mention';

            bot.trigger('direct_mention',[message]);
            return false;
          } else if (message.text.match(mention)) {
            message.event = 'mention';

            bot.trigger('mention',[message]);
            return false;
          } else {
            message.event = 'ambient';
            bot.trigger('ambient',[message]);
            return false;

          }
        }
      } else {
        // this is a non-message object, so trigger a custom event based on the type
        bot.trigger(message.type,[message]);
      }
    });

  }

  bot.closeRTM = function(connection) {

    connection.rtm.close();

  }

  bot.startRTM = function(connection,cb) {

    bot.useConnection(connection);
    bot.api.rtm.start({
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
        connection.identity = res.self;
        connection.team_info = res.team;

        // also available
        // res.users
        // res.channels
        // res.groups
        // res.ims
        // res.bots
        // these could be stored and cached for later use!

        bot.log("** BOT ID: ", connection.identity.name," ...attempting to connect to RTM!");

        connection.rtm = new ws(res.url);
        connection.msgcount = 1;

        connection.rtm.on('open',function() {
          bot.trigger('rtm_open',[connection]);

          connection.rtm.on('message', function(data, flags) {
            var message = JSON.parse(data);

            // Lets construct a nice quasi-standard botkit message
            // it leaves the main slack message at the root
            // but adds in additional fields for internal use!
            // (including the teams api details)

            message._connection = connection;
           bot.receiveMessage(message);

          });

          if (!bot.tickInterval) {

            // set up a once a second tick to process messages
            bot.tickInterval = setInterval(function() {
             bot.tick();
            },1000);
          }

          if (cb) {
            cb(null,connection,res);
          }

        })

         connection.rtm.on('error',function(err) {
           bot.log("RTM websocket error!",err)
           bot.trigger('rtm_close',[connection,err]);
         });

         connection.rtm.on('close',function() {
           bot.trigger('rtm_close',[connection]);
         });

       }
     });
  }

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

  // convenience method for adding user record to message object
  bot.lookupMessageUser = function(message,cb) {

    if (message.user) {
      bot.useConnection(message._connection);
      bot.api.users.info({user: message.user},function(err,res) {

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
  bot.startPrivateConversation = function(message,cb) {
    bot.startTask(message,function(task,convo) {
      bot.startDM(task,message.user,function(err,dm) {
        convo.stop();
        cb(err,dm);
      })
    })
  }

  // convenience method for creating a DM convo
  bot.startDM = function(task,user_id,cb) {

    bot.useConnection(task.connection);
    bot.api.im.open({user:user_id},function(err,channel) {
      if (err) {
        cb(err);
      } else {
        cb(null,task.startConversation({channel:channel.channel.id, user: user_id}));
      }
    });
  }

  bot.identifyBot = function(message,cb) {
    if (message._connection.identity) {
      bot.identifyTeam(message,function(err,team) {
        cb(null,{name: message._connection.identity.name,id:message._connection.identity.id,team_id:team});
      });
    } else {
      // Note: Are there scenarios other than the RTM
      // where we might pull identity info, perhaps from
      // bot.api.auth.test on a given token?
      cb('Identity Unknown: Not using RTM api');
    }
  }

  bot.identifyTeam = function(message,cb) {

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

  bot.say = function(connection,message,cb) {
    bot.debug('SAY ',message);

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
      bot.useConnection(connection);
      bot.api.chat.postMessage(slack_message,function(err,res) {
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

  bot.replyPublic = function(src,resp,cb) {

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

  bot.replyPublicDelayed = function(src,resp,cb) {

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
          bot.log('Error sending slash command response:',err);
          if (cb) { cb(err); }
        } else {
          if (cb) { cb(null); }
        }
      }).form(JSON.stringify(msg));
    }

  }

  bot.replyPrivate = function(src,resp,cb) {

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

  bot.replyPrivateDelayed = function(src,resp,cb) {

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
          bot.log('Error sending slash command response:',err);
          if (cb) { cb(err) }
        } else {
          if (cb) { cb(null) }
        }
      }).form(JSON.stringify(msg));
    }

  }

  bot.reply = function(src,resp,cb) {

    var msg = {};

    if (typeof(resp)=='string') {
        msg.text = resp;
        msg.channel = src.channel;
    } else {
      msg = resp;
      msg.channel = src.channel;
    }

    console.log('say,',msg);

    bot.say(src._connection,msg,cb);

  }


  /***

    This handles the particulars of finding an existing conversation or
    topic to fit the message into...

   ***/

  bot.findConversation = function(message,cb) {
    bot.debug('CUSTOM FIND CONVO',message.user,message.channel);
    if (message.type=='message' || message.type=='slash_command' || message.type=='outgoing_webhook') {
      for (var t = 0; t < bot.tasks.length; t++) {
        for (var c = 0; c < bot.tasks[t].convos.length; c++) {
          if (
            bot.tasks[t].convos[c].isActive()
            && bot.tasks[t].convos[c].source_message.user==message.user
            && bot.tasks[t].convos[c].source_message.channel==message.channel
          ) {
            bot.debug('FOUND EXISTING CONVO!');
            cb(bot.tasks[t].convos[c]);
            return;
          }
        }
      }
    }
    cb(null);

  }


  // set up the RTM message handlers once
  bot.handleSlackEvents();

  return bot;
}

module.exports = Slackbot;
