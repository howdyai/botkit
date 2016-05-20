var should = require('should');
var Botkit = require('../');
var path = require('path');
var tmpdir = require('os').tmpdir();
var fs = require('fs');
var winston = require('winston');

var token = process.env.TOKEN;

describe('Test', function() {
    it('should have a token', function(done) {
        should.exist(token);
        done();
    });

    it('should have Botkit instance', function(done) {
        should.exist(Botkit);
        should.exist(Botkit.core);
        should.exist(Botkit.slackbot);
        done();
    });
});

describe('Botkit', function() {
    this.timeout(5000);

    it('should start and then stop', function(done) {
        var controller = Botkit.slackbot({debug: false});
        var openIsCalled = false;

        controller.on('rtm_open', function(bot) {
            should.exist(bot);
            openIsCalled = true;
        });

        controller.on('rtm_close', function(bot) {
            should.exist(bot);
            openIsCalled.should.be.true;
            controller.shutdown();
            done();
        });

        controller
            .spawn({
                token: token
            })
            .startRTM(function(err, bot, payload) {
                (err === null).should.be.true;
                should.exist(bot);
                bot.closeRTM();
            });
    });

    it('should have fail with false token', function(done) {
        this.timeout(5000);

        var controller = Botkit.slackbot({debug: false});

        controller
            .spawn({
                token: '1234'
            })
            .startRTM(function(err, bot, payload) {
                should.exist(err);

                controller.shutdown();
                done();
            });
    });
});

describe('Log', function() {
    it('should use an external logging provider', function(done) {
        var logFile = path.join(tmpdir, 'botkit.log');
        var logger = new winston.Logger({
            transports: [
                new (winston.transports.File)({ filename: logFile })
            ]
        });

        logger.cli();

        var controller = Botkit.slackbot({
                debug: true,
                logger: logger
            });

        controller
            .spawn({
                token: '1234'
            })
            .startRTM(function(err, bot, payload) {
                should.exist(err);

                controller.shutdown();

                fs.readFile(logFile, 'utf8', function(err, res) {
                    (err === null).should.be.true;
                    should.exist(res);
                    done();
                });
            });
    });
});
