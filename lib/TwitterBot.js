const request = require("request");
const CoreBot = require("botkit").core;
const crypto = require("crypto");
var qs = require("querystring");

function TwitterBot(configuration) {
  // Create a core botkit bot
  const twitter_botkit = CoreBot(configuration || {});

  twitter_botkit.middleware.spawn.use(function(bot, next) {
    next();
  });

  twitter_botkit.middleware.normalize.use(function(bot, message, next) {
    message.type = "message_received";
    next();
  });

  twitter_botkit.middleware.normalize.use(function(bot, message, next) {
    message.to = message.raw_message.message_create.target.recipient_id;
    // capture the user ID
    message.user = message.raw_message.message_create.sender_id;
    // since there are only 1:1 channels on Twitter, the channel id is set to the user id
    message.channel = message.user;

    message.text = message.raw_message.message_create.message_data.text;

    next();
  });

  twitter_botkit.middleware.format.use(function(
    bot,
    message,
    platform_message,
    next
  ) {
    platform_message.event = {
      type: "message_create"
    };
    const message_create = (platform_message.event.message_create = {
      target: { recipient_id: message.to }
    });
    const message_data = (message_create.message_data = {});
    message_data.text = message.text || "";
    if (message.quick_replies) {
      const quick_reply = (message_data.quick_reply = {});
      quick_reply.type = "options";
      quick_reply.options = quick_replies.map(reply => ({
        label: reply.title,
        description: reply.payload
      }));
    }
    if (Array.isArray(message.files)) {
      message.files.map(file => ({
        // TODO: file.url
      }));
    }
    if (twitter_botkit.config.custom_profile_id) {
      message_create.custom_profile_id =
        twitter_botkit.config.custom_profile_id;
    }
    next();
  });

  twitter_botkit.createWebhookEndpoints = function(webserver, bot, cb) {
    twitter_botkit.log(
      // prettier-ignore
      "** Serving webhook endpoints for Twitter Account Activity API at: " +
        "http://" + twitter_botkit.config.hostname + ":" + twitter_botkit.config.port + "/twitter/receive"
    );

    /**
     * Receives Account Activity events
     **/
    webserver.post("/twitter/receive", function(request, response) {
      // Ingest only message received from other accounts
      const dmEvents = request.body.direct_message_events;
      if (dmEvents) {
        request.body.direct_message_events.forEach(function(e) {
          if (
            e.type === "message_create" &&
            twitter_botkit.account_id &&
            e.message_create.sender_id !== twitter_botkit.account_id
          ) {
            twitter_botkit.ingest(bot, e, response);
          }
        });
      }
      response.send("200 OK");
    });

    /**
     * Receives challenge response check (CRC)
     **/
    webserver.get("/twitter/receive", function(request, response) {
      var crc_token = request.query.crc_token;

      if (crc_token) {
        const hash = crypto
          .createHmac("sha256", process.env.TWITTER_CONSUMER_SECRET)
          .update(crc_token)
          .digest("base64");

        response.status(200);
        response.send({
          response_token: "sha256=" + hash
        });
      } else {
        response.status(400);
        response.send("Error: crc_token missing from request.");
      }
    });

    if (!twitter_botkit.config.account_id) {
      const {
        consumer_key,
        consumer_secret,
        access_token,
        access_token_secret
      } = twitter_botkit.config;

      // Verify credentials to retrieve the account id
      request.get(
        {
          json: true,
          url: "https://api.twitter.com/1.1/account/verify_credentials.json",
          oauth: {
            consumer_key,
            consumer_secret,
            token: access_token,
            token_secret: access_token_secret
          }
        },
        function(err, response, body) {
          if (err) {
            twitter_botkit.debug("ERROR VERIFING CREDENTIALS", err);
            return cb && cb(err);
          }
          if (body.errors) {
            twitter_botkit.debug("API ERROR", body.errors[0]);
            return cb && cb(body.errors[0]);
          }
          twitter_botkit.debug("CREDENTIALS VERIFIED", body);
          twitter_botkit.account_id = body.id_str;
          cb && cb();
        }
      );
    } else {
      twitter_botkit.account_id = twitter_botkit.config.account_id;
    }

    return twitter_botkit;
  };

  twitter_botkit.defineBot(function(botkit, config) {
    var bot = {
      type: "tw",
      botkit: botkit,
      config: config || {},
      utterances: botkit.utterances
    };

    bot.send = function(msg, cb) {
      const {
        consumer_key,
        consumer_secret,
        access_token,
        access_token_secret
      } = twitter_botkit.config;

      // construct request to send a Direct Message
      request.post(
        {
          json: true,
          url: "https://api.twitter.com/1.1/direct_messages/events/new.json",
          oauth: {
            consumer_key,
            consumer_secret,
            token: access_token,
            token_secret: access_token_secret
          },
          body: msg
        },
        function(err, response, body) {
          if (err) {
            botkit.debug("WEBHOOK ERROR", err);
            return cb && cb(err);
          }
          if (body.errors) {
            botkit.debug("API ERROR", body.errors[0]);
            return cb && cb(body.errors[0]);
          }
          botkit.debug("WEBHOOK SUCCESS", body);
          cb && cb(null, body);
        }
      );
    };

    bot.showTypingIndicator = function(to, cb) {
      const {
        consumer_key,
        consumer_secret,
        access_token,
        access_token_secret
      } = twitter_botkit.config;
      request.post(
        {
          json: true,
          url:
            "https://api.twitter.com/1.1/direct_messages/indicate_typing.json?" +
            qs.stringify({
              recipient_id: to
            }),
          oauth: {
            consumer_key,
            consumer_secret,
            token: access_token,
            token_secret: access_token_secret
          }
        },
        function(err, response, body) {
          if (err) {
            botkit.debug("TYPING INDICATOR ERROR", err);
            return cb && cb(err);
          }
          if (body && body.errors) {
            botkit.debug("TYPING INDICATOR API ERROR", body.errors[0]);
            return cb && cb(body.errors[0]);
          }
          botkit.debug("TYPING INDICATOR SUCCESS");
          cb && cb(null, body);
        }
      );
    };

    bot.reply = function(src, resp, cb) {
      bot.showTypingIndicator(src.user, function(err) {
        const sayCallback = function() {
          var msg = {};
          if (typeof resp == "string") {
            msg.text = resp;
          } else {
            msg = resp;
          }

          msg.channel = src.channel;
          msg.to = src.user;

          bot.say(msg, cb);
        };
        if (!err) {
          // Wait 3 seconds, the time the indicator is shown on twitter API
          setTimeout(sayCallback, 3000);
        } else {
          sayCallback();
        }
      });
    };

    bot.findConversation = function(message, cb) {
      botkit.debug("DEFAULT FIND CONVO");
      cb(null);
    };

    return bot;
  });

  twitter_botkit.startTicking();

  return twitter_botkit;
}

module.exports = TwitterBot;
