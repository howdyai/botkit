
## Storing Information

Botkit has a built in storage system used to keep data on behalf of users and teams between sessions. Botkit uses this system automatically when storing information for Slack Button applications (see below).

By default, Botkit will use [json-file-store](https://github.com/flosse/json-file-store) to keep data in JSON files in the filesystem of the computer where the bot is executed. (Note this will not work on Heroku or other hosting systems that do not let node applications write to the file system.) Initialize this system when you create the bot:
```javascript
var controller = Botkit.slackbot({
  json_file_store: 'path_to_json_database'
});
```

This system supports freeform storage on a team-by-team, user-by-user, and channel-by-channel basis. Basically ```controller.storage``` is a key value store. All access to this system is through the following twelve functions. Example usage:
```javascript
controller.storage.users.save({id: message.user, foo:'bar'}, function(err) { ... });
controller.storage.users.get(id, function(err, user_data) {...});
controller.storage.users.delete(id, function(err) {...});
controller.storage.users.all(function(err, all_user_data) {...});

controller.storage.channels.save({id: message.channel, foo:'bar'}, function(err) { ... });
controller.storage.channels.get(id, function(err, channel_data) {...});
controller.storage.channels.delete(id, function(err) {...});
controller.storage.channels.all(function(err, all_channel_data) {...});

controller.storage.teams.save({id: message.team, foo:'bar'}, function(err) { ... });
controller.storage.teams.get(id, function(err, team_data) {...});
controller.storage.teams.delete(id, function(err) {...});
controller.storage.teams.all(function(err, all_team_data) {...});
```

Note that save must be passed an object with an id. It is recommended to use the team/user/channel id for this purpose.
```[user/channel/team]_data``` will always be an object while ```all_[user/channel/team]_data``` will always be a list of objects.

### Writing your own storage module

If you want to use a database or do something else with your data,
you can write your own storage module and pass it in.

Make sure your module returns an object with all the methods. See [simple_storage.js](https://github.com/howdyai/botkit/blob/master/lib/storage/simple_storage.js) for an example of how it is done!
Make sure your module passes the test in [storage_test.js](https://github.com/howdyai/botkit/blob/master/lib/storage/storage_test.js).

Then, use it when you create your bot:
```javascript
var controller = Botkit.slackbot({
  storage: my_storage_provider
})
```

## Botkit Documentation Index

* [Get Started](readme.md)
* [Botkit Studio API](readme-studio.md)
* [Function index](readme.md#developing-with-botkit)
* [Extending Botkit with Plugins and Middleware](middleware.md)
  * [Message Pipeline](readme-pipeline.md)
  * [List of current plugins](readme-middlewares.md)
* [Storing Information](storage.md)
* [Logging](logging.md)
* Platforms
  * [Web and Apps](readme-web.md)
  * [Slack](readme-slack.md)
  * [Cisco Spark](readme-ciscospark.md)
  * [Microsoft Teams](readme-teams.md)
  * [Facebook Messenger](readme-facebook.md)
  * [Twilio SMS](readme-twiliosms.md)
  * [Twilio IPM](readme-twilioipm.md)
  * [Microsoft Bot Framework](readme-botframework.md)
* Contributing to Botkit
  * [Contributing to Botkit Core](../CONTRIBUTING.md)
  * [Building Middleware/plugins](howto/build_middleware.md)
  * [Building platform connectors](howto/build_connector.md)
