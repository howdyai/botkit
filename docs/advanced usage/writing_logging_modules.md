## Writing your own logging module

By default, your bot will log to the standard JavaScript `console` object
available in Node.js. This will synchronously print logging messages to stdout
of the running process.

There may be some cases, such as remote debugging or rotating of large logs,
where you may want a more sophisticated logging solution. You can write your
own logging module that uses a third-party tool, like
[winston](https://github.com/winstonjs/winston) or
[Bristol](https://github.com/TomFrost/Bristol). Just create an object with a
`log` method. That method should take a severity level (such as `'error'` or
`'debug'`) as its first argument, and then any number of other arguments that
will be logged as messages. (Both Winston and Bristol create objects of this
description; it's a common interface.)

Then, use it when you create your bot:
```javascript
var controller = Botkit.slackbot({
  logger: new winston.Logger({
    levels: winston.config.syslog.levels
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: './bot.log' })
    ]
  })
});
```

Note: with Winston, we must use the syslog.levels over the default or else some botkit log messages (like 'notice') will not be logged properly.  
