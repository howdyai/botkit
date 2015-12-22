var Botkit = require(__dirname+'/CoreBot.js');
var request = require('request');
var express = require('express'),
    bodyParser = require("body-parser");


function Slackbot(configuration) {

  // Create a core botkit bot
  var slack_botkit = Botkit(configuration||{});

  // customize the bot definition, which will be used when new connections
  // spawn!
  slack_botkit.defineBot(require(__dirname+'/Slackbot_worker.js'));

  // set up configuration for oauth
  // slack_app_config should contain
  // { clientId, clientSecret, scopes}
  // https://api.slack.com/docs/oauth-scopes
  slack_botkit.configureSlackApp = function(slack_app_config,cb) {

    slack_botkit.log('** Configuring app as a Slack App!');
    if (!slack_app_config || !slack_app_config.clientId || !slack_app_config.clientSecret || !slack_app_config.scopes) {
      throw new Error('Missing oauth config details',bot);
    } else {
      slack_botkit.config.clientId = slack_app_config.clientId;
      slack_botkit.config.clientSecret = slack_app_config.clientSecret;
      if (slack_app_config.redirectUri) slack_botkit.config.redirectUri = slack_app_config.redirectUri;;
      if (typeof(slack_app_config.scopes)=='string') {
        slack_botkit.config.scopes = slack_app_config.scopes.split(/\,/);
      } else {
        slack_botkit.config.scopes = slack_app_config.scopes;
      }
      if (cb) cb(null,bot);
    }

    return slack_botkit;

  }

  // set up a web route that is a landing page
  slack_botkit.createHomepageEndpoint = function(webserver) {

    slack_botkit.log('** Serving app landing page at : http://MY_HOST:' + slack_botkit.config.port + '/');

    // FIX THIS!!!
    // this is obvs not right.
    webserver.get('/',function(req,res) {

      res.send('Howdy!');

    });

    return slack_botkit;

  }

  // set up a web route for receiving outgoing webhooks and/or slash commands
  slack_botkit.createWebhookEndpoints = function(webserver) {

    slack_botkit.log('** Serving webhook endpoints for Slash commands and outgoing webhooks at: http://MY_HOST:' + slack_botkit.config.port + '/slack/receive');
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

        slack_botkit.findTeamById(message.team_id,function(err,team) {
          // FIX THIS
          // this won't work for single team bots because the team info
          // might not be in a db
          if (err || !team) {
            slack_botkit.log('Received slash command, but could not load team');

          } else {
            message.type='slash_command';
            // HEY THERE
            // Slash commands can actually just send back a response
            // and have it displayed privately. That means
            // the callback needs access to the res object
            // to send an optional response.

            res.status(200);

            var bot = slack_botkit.spawn(team);

            bot.team_info = team;
            bot.res = res;

            slack_botkit.receiveMessage(bot,message);

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

        slack_botkit.findTeamById(message.team_id,function(err,team) {

          // FIX THIS
          // this won't work for single team bots because the team info
          // might not be in a db
          if (err || !team) {
            slack_botkit.log('Received outgoing webhook but could not load team');
          } else {
            message.type='outgoing_webhook';


            res.status(200);

            var bot = slack_botkit.spawn(team);
            bot.res = res;
            bot.team_info = team;


            slack_botkit.receiveMessage(bot,message);

            // outgoing webhooks are also different. They can simply return
            // a response instead of using the API to reply.  Maybe this is
            // a different type of event!!

          }
        });

      }

    })

    return slack_botkit;
  }

  slack_botkit.saveTeam = function(team,cb) {

    slack_botkit.storage.teams.save(team,cb);

  }

  // look up a team's memory and configuration and return it, or
  // return an error!
  slack_botkit.findTeamById = function(id,cb) {

    slack_botkit.storage.teams.get(id,cb);

  }

  slack_botkit.setupWebserver = function(port,cb) {

    if (!port) {
      throw new Error("Cannot start webserver without a port");
    }
    if (isNaN(port)) {
      throw new Error("Specified port is not a valid number");
    }

    slack_botkit.config.port = port;

    slack_botkit.webserver = express();
    slack_botkit.webserver.use(bodyParser.json());
    slack_botkit.webserver.use(bodyParser.urlencoded({ extended: true }));
    slack_botkit.webserver.use(express.static(__dirname + '/public'));

    var server = slack_botkit.webserver.listen(slack_botkit.config.port, function () {
      slack_botkit.log('** Starting webserver on port ' + slack_botkit.config.port);
      if (cb) { cb(null,slack_botkit.webserver); }
    });

    return slack_botkit;

  }

  // get a team url to redirect the user through oauth process
  slack_botkit.getAuthorizeURL = function(team_id) {

    var url = 'https://slack.com/oauth/authorize';
    var scopes = slack_botkit.config.scopes;
    url = url + "?client_id=" + slack_botkit.config.clientId + "&scope=" + scopes.join(",") + "&state=botkit"

    if (team_id) {
      url = url + "&team=" + team_id;
    }
    if (slack_botkit.config.redirectUri) {
      url = url + "&redirect_uri="+slack_botkit.config.redirectUri;
    }

    return url;

  }

  // set up a web route for redirecting users
  // and collecting authentication details
  // https://api.slack.com/docs/oauth
  // https://api.slack.com/docs/oauth-scopes
  slack_botkit.createOauthEndpoints = function(webserver,callback) {

    slack_botkit.log('** Serving login URL: http://MY_HOST:' + slack_botkit.config.port + '/login');

    if (!slack_botkit.config.clientId) {
      throw new Error('Cannot create oauth endpoints without calling configureSlackApp() with a clientId first');
    }
    if (!slack_botkit.config.clientSecret) {
      throw new Error('Cannot create oauth endpoints without calling configureSlackApp() with a clientSecret first');
    }
    if (!slack_botkit.config.scopes) {
      throw new Error('Cannot create oauth endpoints without calling configureSlackApp() with a list of scopes first');
    }

    var call_api = function(command,options,cb) {
        slack_botkit.log('** API CALL: ' + 'https://slack.com/api/'+command);
        request.post('https://slack.com/api/'+command,function (error, response, body) {
         slack_botkit.debug('Got response',error,body);
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
      }


    var oauth_access=function(options,cb) {
      call_api('oauth.access',options,cb);
    }

    var auth_test=function(options,cb) {
      call_api('auth.test',options,cb);
    }

    webserver.get('/login',function(req,res) {

        res.redirect(slack_botkit.getAuthorizeURL())

    });


    slack_botkit.log('** Serving oauth return endpoint: http://MY_HOST:' + slack_botkit.config.port + '/oauth');

    webserver.get('/oauth',function(req,res) {

      var code = req.query.code;
      var state = req.query.state;

      var opts = {
        client_id: slack_botkit.config.clientId,
        client_secret: slack_botkit.config.clientSecret,
        code: code
      };

      if (slack_botkit.config.redirectUri) opts.redirect_uri = slack_botkit.config.redirectUri;

      oauth_access(opts,function(err,auth) {

        if (err) {
          if (callback) {
            callback(err,req,res);
          } else {
            res.status(500).send(err);
          }
          slack_botkit.trigger('oauth_error',[err]);
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
          //slack_botkit.config.token = auth.access_token;
          auth_test({token: auth.access_token},function(err,identity) {

            if (err) {
              if (callback) {
                callback(err,req,res);
              } else {
                res.status(500).send(err);
              }

              slack_botkit.trigger('oauth_error',[err]);

            } else {

              // we need to deal with any team-level provisioning info
              // like incoming webhooks and bot users
              // and also with the personal access token from the user



                slack_botkit.findTeamById(identity.team_id,function(err,team) {

                  var isnew = false;
                  if (!team) {
                    isnew = true;
                    team = {
                      id: identity.team_id,
                      createdBy: identity.user_id,
                      url: identity.url,
                      name: identity.team,
                    }
                  }

                  var bot = slack_botkit.spawn(team);

                  if (auth.incoming_webhook) {
                    auth.incoming_webhook.token = auth.access_token;
                    auth.incoming_webhook.createdBy = identity.user_id;
                    team.incoming_webhook = auth.incoming_webhook;
                    bot.configureIncomingWebhook(team.incoming_webhook);
                    slack_botkit.trigger('create_incoming_webhook',[bot,team.incoming_webhook]);
                  }

                  if (auth.bot) {
                    team.bot = {
                      token: auth.bot.bot_access_token,
                      user_id: auth.bot.bot_user_id,
                      createdBy: identity.user_id,
                    }
                    bot.configureRTM(team.bot);
                    slack_botkit.trigger('create_bot',[bot,team.bot]);
                  }

                  slack_botkit.saveTeam(team,function(err,id) {
                    if (err) {
                      slack_botkit.log('An error occurred while saving a team: ',err);
                      if (callback) {
                        callback(err,req,res);
                      } else {
                        res.status(500).send(err);
                      }
                      slack_botkit.trigger('error',[err]);
                    } else {
                      if (isnew) {
                        slack_botkit.trigger('create_team',[bot,team]);
                      } else {
                        slack_botkit.trigger('update_team',[bot,team]);
                      }

                      slack_botkit.storage.users.get(identity.user_id,function(err,user) {
                        isnew=false;
                        if (!user) {
                          isnew=true;
                          user = {
                            id: identity.user_id,
                            access_token: auth.access_token,
                            scopes: scopes,
                            team_id: identity.team_id,
                            user: identity.user,
                          }
                        }
                        slack_botkit.storage.users.save(user,function(err,id) {

                          if (err) {
                            slack_botkit.log('An error occurred while saving a user: ',err);
                            if (callback) {
                              callback(err,req,res);
                            } else {
                              res.status(500).send(err);
                            }
                            slack_botkit.trigger('error',[err]);
                          } else {
                            if (isnew) {
                              slack_botkit.trigger('create_user',[bot,user]);
                            } else {
                              slack_botkit.trigger('update_user',[bot,user]);
                            }
                            if (callback) {
                              callback(null,req,res);
                            } else {
                              res.redirect('/');
                            }
                          }
                        });
                      });
                    }
                  });
                });
              }
            });

        }

      });

    });

    return slack_botkit;

  }

  slack_botkit.handleSlackEvents = function() {

    slack_botkit.log('** Setting up custom handlers for processing Slack messages');
    slack_botkit.on('message_received',function(bot,message) {


      if (message.ok!=undefined) {
        // this is a confirmation of something we sent.
        return false;
      }

      slack_botkit.debug('DEFAULT SLACK MSG RECEIVED RESPONDER');
      if ('message' == message.type) {

        if (message.text) {
          message.text = message.text.trim();
        }

        // set up a couple of special cases based on subtype
        if (message.subtype && message.subtype=='channel_join') {
          // someone joined. maybe do something?
          if (message.user==bot.identity.id) {
            slack_botkit.trigger('bot_channel_join',[bot,message]);
            return false;
          } else {
            slack_botkit.trigger('user_channel_join',[bot,message]);
            return false;
          }
        } else if (message.subtype && message.subtype == 'group_join') {
          // someone joined. maybe do something?
          if (message.user==bot.identity.id) {
            slack_botkit.trigger('bot_group_join',[bot,message]);
            return false;
          } else {
            slack_botkit.trigger('user_group_join',[bot,message]);
            return false;
          }

        } else if (message.subtype) {
          slack_botkit.trigger(message.subtype,[bot,message]);
          return false;

        } else if (message.channel.match(/^D/)){
          // this is a direct message
          if (message.user==bot.identity.id) {
            return false;
          }

          if (!message.text) {
            // message without text is probably an edit
            return false;
          }

          // remove direct mention so the handler doesn't have to deal with it
          var direct_mention = new RegExp('^\<\@' + bot.identity.id + '\>','i');
          message.text = message.text.replace(direct_mention,'').replace(/^\s+/,'').replace(/^\:\s+/,'').replace(/^\s+/,'');

          message.event = 'direct_message';

          slack_botkit.trigger('direct_message',[bot,message]);
          return false;

        } else {
          if (message.user==bot.identity.id) {
            return false;
          }
          if (!message.text) {
            // message without text is probably an edit
            return false;
          }

          var direct_mention = new RegExp('^\<\@' + bot.identity.id + '\>','i');
          var mention = new RegExp('\<\@' + bot.identity.id + '\>','i');

          if (message.text.match(direct_mention)) {
            // this is a direct mention
            message.text = message.text.replace(direct_mention,'').replace(/^\s+/,'').replace(/^\:\s+/,'').replace(/^\s+/,'');
            message.event = 'direct_mention';

            slack_botkit.trigger('direct_mention',[bot,message]);
            return false;
          } else if (message.text.match(mention)) {
            message.event = 'mention';

            slack_botkit.trigger('mention',[bot,message]);
            return false;
          } else {
            message.event = 'ambient';
            slack_botkit.trigger('ambient',[bot,message]);
            return false;

          }
        }
      } else {
        // this is a non-message object, so trigger a custom event based on the type
        slack_botkit.trigger(message.type,[bot,message]);
      }
    });

  }

  // set up the RTM message handlers once
  slack_botkit.handleSlackEvents();

  return slack_botkit;
}

module.exports = Slackbot;
