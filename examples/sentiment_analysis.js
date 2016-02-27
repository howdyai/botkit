'use strict';
/* "dependencies": {
    "botkit": "0.0.7",
    "escape-string-regexp": "^1.0.5",
    "lodash": "^4.5.1",
    "mongodb": "^2.1.7",
    "sentiment": "^1.0.6",
  }
 */
var _ = require('lodash');
var escapeStringRegexp = require('escape-string-regexp');
var botkit = require('botkit');
var mongodb = require('mongodb');
var sentiment = require('sentiment');

function connectToDb() {
    mongodb.MongoClient.connect('mongodb://localhost:27017/sentiment', function (err, db) {
        if (err) {
            throw err;
        }
        console.log('Connection established to mongodb');
        startBot(db);
    });
}

function startBot(db) {
    var collection = db.collection('sentiment');

    var INSTANCE_PUBLIC_SHAMING = true;
    var INSTANCE_PUBLIC_SHAMING_THRESHOLD = -4;

    var INSTANCE_PRIVATE_SHAMING = true;
    var INSTANCE_PRIVATE_SHAMING_THRESHOLD = -4;

    var COUNT_POSITIVE_SCORES = true;
    var COUNT_NEGATIVE_SCORES = true;

    var INSTANCE_PUBLIC_SHAMING_MESSAGES = [
        'Remember to keep up the DoublePlusGood GoodThink vibes for our SafeSpace.',
        'Remember, we\'re all in this together for the benefit of our Company.',
        'Let\'s stay positive! Remember: There\'s no I in team but there\'s an "eye" in ' +
            'this team. ;)',
        'We wouldn\'t want this to stay on our permanent record. Let\'s speak more positively' ];
    var INSTANCE_PRIVATE_SHAMING_MESSAGES = [
        'Please remember to be civil. This will be on your HR file.',
        'Only Happy fun times are allowed here. Remember GoodThink and PositiveVibes.',
        'Let\'s stay positive! Remember: There\'s no I in team but there\'s an "eye" in this ' +
            'team. ;). Watching you.',
        'Upbeat messages only. This has been logged to keep everyone safe.' ];

    var afinn = require('sentiment/build/AFINN.json');

    var botkitController = botkit.slackbot({
        debug: false
    });

    botkitController.spawn({
        token: process.env.token
    }).startRTM(function (err) {
        if (err) {
            throw err;
        }
    });

    botkitController.hears([ 'hello', 'hi' ], [ 'direct_mention' ], function (bot, message) {
        bot.reply(message, 'Hello. I\'m watching you.');
    });

    var formatReportList = function formatReportList(result) {
        return result.map(function (i) {
            return '<@' + i._id + '>: ' + i.score;
        });
    };

    botkitController.hears([ 'report' ], [ 'direct_message', 'direct_mention' ], function (bot, message) {
        collection.aggregate([ { $sort: { score: 1 } }, { $limit: 10 } ]).toArray(
            function (err, result) {
                if (err) {
                    throw err;
                }

                var topList = formatReportList(result);
                bot.reply(message, 'Top 10 Scores:\n' + topList.join('"\n"'));
            });
        collection.aggregate([ { $sort: { score: -1 } }, { $limit: 10 } ]).toArray(
            function (err, result) {
                if (err) {
                    throw err;
                }

                var bottomList = formatReportList(result);
                bot.reply(message, 'Bottom 10 Scores:\n' + bottomList.join('\n'));
            });
    });

    var listeningFor = '^' + Object.keys(afinn).map(escapeStringRegexp).join('|') + '$';
    botkitController.hears([ listeningFor ], [ 'ambient' ], function (bot, message) {
        var sentimentAnalysis = sentiment(message.text);
        console.log({ sentimentAnalysis: sentimentAnalysis });
        if (COUNT_POSITIVE_SCORES == false && sentimentAnalysis.score > 0) {
            return;
        }

        if (COUNT_NEGATIVE_SCORES == false && sentimentAnalysis.score < 0) {
            return;
        }

        collection.findAndModify({ _id: message.user }, [ [ '_id', 1 ] ], {
            $inc: { score: sentimentAnalysis.score }
        }, { 'new': true, upsert: true }, function (err, result) {
            if (err) {
                throw err;
            }

            // full doc is available in result object:
            // console.log(result)
            var shamed = false;
            if (INSTANCE_PUBLIC_SHAMING &&
                sentimentAnalysis.score <= INSTANCE_PUBLIC_SHAMING_THRESHOLD) {
                shamed = true;
                bot.startConversation(message, function (err, convo) {
                    if (err) {
                        throw err;
                    }

                    var publicShamingMessage = _.sample(INSTANCE_PUBLIC_SHAMING_MESSAGES);
                    console.log({ publicShamingMessage: publicShamingMessage });
                    convo.say(publicShamingMessage);
                });
            }

            if (!shamed && INSTANCE_PRIVATE_SHAMING &&
                sentimentAnalysis.score <= INSTANCE_PRIVATE_SHAMING_THRESHOLD) {
                bot.startPrivateConversation(message, function (err, dm) {
                    if (err) {
                        throw err;
                    }

                    var privateShamingMessage = _.sample(INSTANCE_PRIVATE_SHAMING_MESSAGES);
                    console.log({ privateShamingMessage: privateShamingMessage });
                    dm.say(privateShamingMessage);
                });
            }
        });
    });
}

if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

connectToDb();
