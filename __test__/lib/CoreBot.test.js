var CoreBot = require('../../lib/CoreBot');

describe('CoreBot', function() {
    test('it should use the error middleware when an exception is thrown in a middleware', function() {
        var bot = CoreBot({});
        var errorHandler = jest.fn();

        bot.middleware.heard.use(function() {
            throw new Error('BAM!');
        });
        bot.middleware.error.use(errorHandler);

        bot.hears('bla', 'direct_mention', function() {});
        bot.trigger('direct_mention', [bot, { text: 'bla' }]);

        expect(errorHandler).toBeCalled();
    });

    test('it should use the error middleware when an exception is passed to the "next" callback', function() {
        var bot = CoreBot({});
        var errorHandler = jest.fn();

        bot.middleware.heard.use(function(bot, message, next) {
            next(new Error('BAM!'));
        });
        bot.middleware.error.use(errorHandler);

        bot.hears('bla', 'direct_mention', function() {});
        bot.trigger('direct_mention', [bot, { text: 'bla' }]);

        expect(errorHandler).toBeCalled();
    });

    test('it should NOT call the handler when an error occurs in the `heard` middleware', function() {
        var bot = CoreBot({});
        var messageHandler = jest.fn();

        bot.middleware.heard.use(function(bot, message, next) {
            next(new Error('BAM!'));
        });

        bot.hears('bla', 'direct_mention', messageHandler);
        bot.trigger('direct_mention', [bot, { text: 'bla' }]);

        expect(messageHandler).not.toBeCalled();
    });

    test('it should not call the error handlers recursively', function() {
        var bot = CoreBot({});
        var errorHandler = jest.fn();

        bot.middleware.heard.use(function(bot, message, next) {
            next(new Error('BAM!'));
        });
        bot.middleware.error.use(errorHandler);
        bot.middleware.error.use(function() {
            throw new Error('BIM!');
        });

        bot.hears('bla', 'direct_mention', function() {});
        bot.trigger('direct_mention', [bot, { text: 'bla' }]);

        expect(errorHandler).toHaveBeenCalledTimes(1);
    });
});
