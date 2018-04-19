# Botkit for Microsoft Teams

Botkit is designed to ease the process of designing and running useful, creative bots that live inside [Microsoft Teams](https://products.office.com/en-us/microsoft-teams/group-chat-software). For a full list of supported platforms, [check out the main Botkit readme](https://github.com/howdyai/botkit#botkit---building-blocks-for-building-bots)

Botkit features a comprehensive set of tools to deal with [Microsoft Teams's integration platform](https://msdn.microsoft.com/en-us/microsoft-teams/), and allows developers to build both custom integrations for their team, as well as public "Microsoft Teams" applications that can be run from a central location, and be used by many teams at the same time.

This document covers the Microsoft Teams-specific implementation details only. [Start here](https://github.com/howdyai/botkit/blob/master/docs/readme.md#developing-with-botkit) if you want to learn about how to develop with Botkit.

Table of Contents

* [Getting Started](#getting-started)
* [Developing with Botkit for Microsoft Teams](#developing-with-botkit-for-microsoft-teams)
* [Working with Microsoft Teams](#working-with-microsoft-teams)
* [Developer and Support Community](#developer--support-community)
* [About Botkit](#about-botkit)
* [Botkit Documentation Index](#botkit-documentation-index)

## Getting Started

Building bots is a fun and rewarding experience, but requires a few technical details be sorted out before you can start poking around inside your robot's brain.

To get started building your bot, you'll need get these *three components* set up so that they can communicate with each other:

* A Botkit-powered Node.js web app - this is the container inside which your bot brain lives, and where all its capabilities are defined
* The messaging platform - the place users interact with your bot, which provides a set of features, APIs and client applications
* A hosting environment - this gives your bot application a publicly reachable address on the public internet, which allows the messaging platform to communicate with your bot

Getting these elements in place is a multi-step process, but only takes a few minutes, and in most cases, only has to be done once!

### Fastest Option: Use Botkit Studio

The fastest way to get up and running with Botkit for Microsoft Teams is to use [Botkit Studio](https://studio.botkit.ai/signup?code=teams).
Botkit Studio will guide you through the process of setting up the [Botkit Starter Kit for Microsoft Teams](https://github.com/howdyai/botkit-starter-teams), walk you through the process of configuring the Microsoft Teams and Bot Framework APIs, and deploy your bot to a stable hosting environment so that you can start building right away.

**[![Sign up for Botkit Studio](studio.png)](https://studio.botkit.ai/signup?code=readme)**

### Manual Setup: Get the Starter Kit

If you are comfortable with developer tools like Git, NPM, and setting up your own web host,
or if you want to build your bot on your laptop before making it available on the internet,
you can start by cloning the [Botkit Starter Kit for Microsoft Teams](https://github.com/howdyai/botkit-starter-teams).
The starter kit contains everything you need to build your bot, including a pre-configured Express webserver,
customizable webhook endpoints, and a set of example features that provide a great base for your new bot.

[Get Botkit Starter Kit for Microsoft Teams](https://github.com/howdyai/botkit-starter-teams)

[Read our step-by-step guide for configuring your starter kit](provisioning/teams.md)

### Expert Option: Get Botkit from NPM

If you are excited about building your entire bot from scratch,
or if you want to integrate bot functionality into an existing Node application,
you can install the Botkit core library directly from NPM.

`npm install --save botkit`

If you choose to use Botkit's core library directly like this, you'll need
to either use Botkit's simple [built-in webserver](#using-the-built-in-webserver),
or configure your own webserver and connect it to Botkit.
An example of this can be seen [in the starter kit](https://github.com/howdyai/botkit-starter-teams).

([Our step-by-step guide to setting things up is probably still be useful, even for experts.](provisioning/teams.md))


## Developing with Botkit for Microsoft Teams

The full code for a simple Microsoft Teams bot is below:

```javascript
var Botkit = require('botkit');

var controller = Botkit.teamsbot({
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
});

controller.setupWebserver(process.env.PORT || 3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, function() {
        console.log("BOTKIT: Webhooks set up!");
    });
});

controller.hears('hello', 'direct_message,direct_mention', function(bot, message) {
    bot.reply(message, 'Hi');
});

controller.on('direct_mention', function(bot, message) {
    bot.reply(message, 'You mentioned me and said, "' + message.text + '"');
});

controller.on('direct_message', function(bot, message) {
    bot.reply(message, 'I got your private message. You said, "' + message.text + '"');
});
```

#### App Package / Manifest File

Before your bot application can be used, you must prepare an "App Package" -
a zip file containing a JSON file of configuration options, and (optionally)
icons for your bot to use inside the Teams interface. This file must then be
"sideloaded" into your Microsoft Teams account - this is just a fancy way
of saying that you will have to upload this file into a settings page.

The manifest.json file is a hefty document, with lots of options! [Here is the full documentation from Microsoft](https://msdn.microsoft.com/en-us/microsoft-teams/schema).
We highly recommend using [Botkit Studio](https://studio.botkit.ai) to build your app package, as we have provided
an easy to use tool to configure and generate the necessary file!

Here is a [COMPLETE SAMPLE](../examples/teams/manifest.json)

[Manifest.json schema docs](https://msdn.microsoft.com/en-us/microsoft-teams/schema)

[How to sideload your app](https://msdn.microsoft.com/en-us/microsoft-teams/sideload)



#### Botkit.teamsbot()
| Argument | Description
|--- |---
| clientId | The application' client id, provided by Bot Framework
| clientSecret | The application's client secret, provided by Bot Framework

This function creates a Teams-ready Botkit controller. The values for clientId and clientSecret must be acquired from [Bot Framework](http://dev.botframework.com).

```javascript
var controller = Botkit.teamsbot({
    debug: true,
    log: true,
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret
});
```

#### controller.spawn()
| Argument | Description
|--- |---
| options | An object defining options for this specific bot instance - MUST include a serviceUrl.

This function returns a new instance of the bot. This is used internally by Botkit
to respond to incoming events.

When spawning a bot for Microsoft Teams, you must pass in a `serviceUrl` field as part of
the options parameter.  The serviceUrl can be extracted from the incoming message payload at `message.serviceUrl`.

For those curious about this parameter: the serviceUrl is used to construct API calls the bot makes to Microsoft's API endpoints.
The endpoint URLs are actually defined dynamically in response to different kinds of incoming messages. This is because Microsoft Teams is just one of a
network of Microsoft products that uses the Bot Framework API specification, each one with its own endpoint URLs.

In the event that your bot needs to send outbound messages without first receiving an inbound event from teams,
you should capture and store the serviceUrl value you receive from the `bot_channel_join` event, which indicates
that a bot has been added to a new team.

```
var bot = controller.spawn({serviceUrl: my_team_info.serviceUrl});
```

#### Using the built-in webserver

In order to receive messages and other events from Microsoft Teams, Botkit must
expose multiple web endpoints.

Botkit includes a simple built-in webserver based on Express that is great for
getting started. With just a few lines of code, Botkit automatically configure
the necessary web endpoints. There are very few options available for the built-in
webserver, as it is intended to be used only for stand-alone bots.

If you want your bot application to have additional web features (like [tabs](#using-tabs)),
or if you need to add bot functionality to an existing Express website,
or if you want to configure your own custom endpoints,
we suggest using the [Express Webserver component](https://github.com/howdyai/botkit-starter-teams/blob/master/components/express_webserver.js)
and [Incoming Webhook Route](https://github.com/howdyai/botkit-starter-teams/blob/master/components/routes/teams.js)
from the Botkit Starter Kit as a guide for your custom implementation.

#### controller.setupWebserver()
| Argument | Description
|---  |---
| port | port for webserver
| callback | callback function

Setup an [Express webserver](http://expressjs.com/en/index.html) for
use with `createWebhookEndpoints()`

#### controller.createWebhookEndpoints()
| Argument | Description
|---  |---
| webserver | An instance of the Express webserver

This function configures the route `http://_your_server_/teams/receive`
to receive incoming event data from Microsoft Teams.

This url should be used when configuring your Bot Framework record.

## Working with Microsoft Teams

In addition to sending and receiving chat messages, Botkit bots can use all
of the other features in the Microsoft Teams API. With these other features,
Botkit bots can send rich attachments with interactive buttons, integrate into
the message composer, and expose integrated tab applications that live inside
the Teams window and share data with the bot.

* [Events](#microsoft-teams-specific-events)
* [API Methods](#api-methods)
* [Attachments](#working-with-attachments-and-media)
* [Buttons](#buttons)
* [User Mentions](#user-mentions)
* [Compose Extensions](#using-compose-extensions)
* [Tabs](#using-tabs)

### Microsoft Teams-specific Events

Botkit receives and makes available all of the events supported by Microsoft Teams.

The full list and payload schema of these events is [available from Microsoft](https://msdn.microsoft.com/en-us/microsoft-teams/botevents).

These events undergo a normalization process for use inside Botkit,
so that any type of event can be passed to `bot.reply()` in order for a normal
message response to be sent. All incoming events will have _at least_ the following fields:

```
{
  type: <type of event>,
  user: <microsoft teams user ID>,
  channel: <id for channel or 1:1 conversation>,
  text: <text of message or primary payload value if present>,
  raw_message: <the original event data>
}
```

Botkit leaves all the native fields intact, so any fields that come in from Teams are still present in the original message.
However, our recommendation for accessing any Teams-native fields is to use the `message.raw_message` sub-object
which contains an unmodified version of the event data.

#### Message Received Events
| Event | Description
|--- |---
| direct_message | the bot received a 1:1 direct message from a user
| direct_mention | the bot was addressed directly in a mult-user channel ("@bot hello!")
| mention | the bot was mentioned by someone in a message ("hello everyone including @bot")

#### User Activity Events:

| Event | Description
|--- |---
| bot_channel_join | the bot has joined a channel
| user_channel_join | a user has joined a channel
| bot_channel_leave | the bot has left a channel
| user_channel_leave | a user has left a channel

#### Channel Events
| Event | Description
|--- |---
| channelDeleted | a channel was deleted
| channelRenamed | a channel was renamed
| channelCreated | a new channel was created

#### Teams Features
| Event | Description
|--- |---
| invoke | a user clicked an `invoke` button [See Buttons](#buttons)
| composeExtension | user submitted a query with the compose extension [See Compose Extensions](#using-compose-extensions)


#### API Methods

The [Microsoft Teams API](https://msdn.microsoft.com/en-us/microsoft-teams/botapis) provides a number of features the bot developer can use to power a useful bot application that operates seamlessly in Teams.

#### bot.api.getUserById(conversationId, userId, cb)
| Parameter | Description
|--- |---
| conversationId | Contains the unique identifier of a conversation
| userId | The unique identifier for a given user
| cb | Callback function in the form function(err, user_profile)

`getUserById` takes elements from an incoming message object, and returns the user profile data
associated with the message's sender.

```javascript
controller.hears('who am i', 'direct_message, direct_mention', function(bot, message) {
    bot.api.getUserById(message.channel, message.user, function(err, user) {
        if (err) {
          bot.reply(message,'Error loading user:' + err);
        } else {
          bot.reply(message,'You are ' + user.name + ' and your email is ' + user.email + ' and your user id is ' + user.id);
        }
    });
});
```

#### bot.api.getUserByUpn(conversationId, upn, cb)
| Parameter | Description
|--- |---
| conversationId | Contains the unique identifier of a conversation
| upn | The [User Principal Name](https://msdn.microsoft.com/en-us/library/windows/desktop/ms721629(v=vs.85).aspx#_security_user_principal_name_gly) of a given team member
| cb | Callback function in the form function(err, user_profile)

This function is identical to `getUserById()`, but instead of fetching the user by the Teams-only user ID, it uses the user's "universal principal name" or "UPN", which defines the account in terms of the broader Microsoft Office ecosystem. This function is useful when connecting users in Microsoft Teams chat with the same users in a [Tab Application](#using-tabs), as tab applications only expose the `upn` value.

The [Botkit Starter Kit for Microsoft Teams](https://github.com/howdyai/botkit-starter-teams) includes [a sample middleware](https://github.com/howdyai/botkit-starter-teams/blob/master/skills/load_user_data.js) that uses this function to automatically
translate the Teams-only ID into a UPN for use with the [built-in storage system](storage.md).

#### bot.api.getConversationMembers(conversationId, cb)
| Parameter | Description
|--- |---
| conversationId | Contains the unique identifier of a conversation
| cb | Callback function in the form function(err, members)

This function returns a list of members in the specified channel - either a 1:1 channel, or a multi-user team channel.
This API returns an array of user profile objects identical to those returned by `getUserById()` and `getUserByUpn()`.

```javascript
controller.hears('get members','direct_mention,direct_message', function(bot, message) {
  bot.api.getConversationMembers(message.channel, function(err, roster) {
    if (err) {
      bot.reply(message,'Error loading roster: ' + err);
    } else {

      var list = [];
      for (var u = 0; u < roster.length; u++) {
        list.push(roster[u].name);
      }
      bot.reply(message,'Conversation members: ' + list.join(', '));
    }
  });
});
```

#### bot.api.getTeamRoster(teamId, cb)
| Parameter | Description
|--- |---
| teamId | The unique identifier for a given team
| cb | Callback function in the form function(err, members)

This function works just like `getConversationMembers()`, but returns all members of a team instead of just the members of a
specific channel.

The teamId, when present, can be extracted from a message object at the Teams-specific field `message.channelData.team.id`. This field is present in messages that occur in multi-user channels, but not in 1:1 messages and other events.

Note that since the team id is not always part of the incoming message payload, and because all multi-user channel contain all members
of the team, `getConversationMembers()` is likely more reliable and easy to use.

```javascript
controller.hears('roster','direct_mention', function(bot, message) {
  bot.api.getTeamRoster(message.channelData.team.id, function(err, roster) {
    if (err) {
      bot.reply(message,'Error loading roster: ' + err);
    } else {
      var list = [];
      for (var u = 0; u < roster.length; u++) {
        list.push(roster[u].name);
      }
      bot.reply(message,'Team roster: ' + list.join(', '));
    }
  });

});
```

### bot.api.updateMessage(conversationId, messageId, replacement, cb)
| Parameter | Description
|--- |---
| conversationId | Contains the identifier for the conversation in which the original message occured
| messageId | Contains the unique identifier of message to be replaced
| replacement | A message object which will be used to replace the previous message
| cb | Callback function in the form function(err, results)

This method allows you to update an existing message with a replacement.
This is super handy when responding to button click events, or updating a message with new information.

In order to update a message, you must first capture it's ID. The message id is part of the response
passed back from bot.reply or bot.say.

`updateMessage()` expects an API-ready message object - the replacement message does _not_ undergo the
normal pre-send transformations that occur during a normal bot.reply or bot.say.

```javascript
  controller.hears('update', 'direct_message,direct_mention', function(bot, message) {
      bot.reply(message,'This is the original message', function(err, outgoing_message) {
          bot.api.updateMessage(message.channel, outgoing_message.id, {type: 'message', text: 'This message has UPDATED CONTENT'}, function(err) {
            if (err) {
              console.error(err);
            }
          });
      });
  })
```

#### bot.api.getChannels(teamId, cb)
| Parameter | Description
|--- |---
| teamId | The unique identifier for a given team
| cb | Callback function in the form function(err, channels)

This function returns an array of all the channels in a given team.

The teamId, when present, can be extracted from a message object at the Teams-specific field `message.channelData.team.id`. This field is present in messages that occur in multi-user channels, but not in 1:1 messages and other events.

```javascript
  controller.hears('channels','direct_mention', function(bot, message) {
    bot.api.getChannels(message.channelData.team.id, function(err, roster) {
      if (err) {
        bot.reply(message,'Error loading channel list: ' + err);
      } else {
        var list = [];
        for (var u = 0; u < roster.length; u++) {
          list.push(bot.channelLink(roster[u]));
        }
        bot.reply(message,'Channels: ' + list.join(', '));
      }
    });
  });
```


#### bot.api.addMessageToConversation(conversationId, message, cb)
| Parameter | Description
|--- |---
| conversationId | Contains the unique identifier of a conversation
| message | The contents of your message
| cb | Callback function in the form function(err, results)

This function is used to send messages to Teams. It is used internally by Botkit's
`bot.say()` function, and is not intended to be used directly by developers.

#### bot.api.createConversation(options, cb)
| Parameter | Description
|--- |---
| options | an object containing {bot: id, members: [], channelData: {}}
| cb | Callback function in the form function(err, new_conversation_object)

This function creates a new conversation context inside Teams.
This is used internally by Botkit inside functions like `startPrivateConversation()`
(to create the 1:1 channel between user and bot). It is not intended to be used directly by developers.


#### Working with attachments and media

In addition to, or as an alternative to text, messages in Microsoft Teams can include one or more attachments.
Attachments appear as interactive cards inside the Teams client, and can include elements such as images,
text, structured data, and interactive buttons.

[Read the official Teams documentation about message attachments](https://msdn.microsoft.com/en-us/microsoft-teams/botsmessages)

To use attachments with Botkit, construct an attachment object and add it to the message object.
Botkit provides a few helper functions to make creating attachment objects easier.

##### Attachment Helpers

##### bot.createHero()
| Parameter | Description
|--- |---
| title OR object| string value for the title of the card, OR an object representing all the fields in the card
| subtitle | string value for the subtitle of the card
| text | string value for the text of the card
| images | an array of image objects - {url: string, alt: string} - currently limited to 1 item
| buttons | an array of action objects - {type: string, title: string, value: string}
| tap action | a single of action object that defines the action to take when a user taps anywhere on the card - {type: string, title: string, value: string}

(See usage notes below)

##### bot.createThumbnail()
| Parameter | Description
|--- |---
| title OR object| string value for the title of the card, OR an object representing all the fields in the card
| subtitle | string value for the subtitle of the card
| text | string value for the text of the card
| images | an array of image objects - {url: string, alt: string} - currently limited to 1 item
| buttons | an array of action objects - {type: string, title: string, value: string}
| tap action | a single of action object that defines the action to take when a user taps anywhere on the card - {type: string, title: string, value: string}

The attachment building helper functions `bot.createHero()` and `bot.createThumbnail()` can be used to
quickly create attachment objects for inclusion in a message.

The return value of these functions is an attachment object that can be directly added to the outgoing message object's `attachments` array.
In addition, the returned attachment object has a few helper methods of its that allow developers to adjust the values:

###### attachment.title()
| Parameter | Description
|--- |---
| value | new value for the title field

###### attachment.subtitle()
| Parameter | Description
|--- |---
| value | new value for the subtitle field

###### attachment.text()
| Parameter | Description
|--- |---
| value | new value for the text field

###### attachment.image()
| Parameter | Description
|--- |---
| url | url to image
| alt | alt description for image

###### attachment.button()
| Parameter | Description
|--- |---
| type OR button object | type of button OR an button object {type: string, title: string, value: string}
| title | string value for the button title
| value | string for the object payload.

###### attachment.tap()
| Parameter | Description
|--- |---
| type OR button object | new value for the title field
| title | string value for the action title
| value | string for the object payload.

###### attachment.asString()

Returns the stringified version of the attachment object

##### Attachment Examples

These functions can be used in a few different ways:

*Create attachment with individual parameters:*
```javascript

var reply = {
  text: 'Here is an attachment!',
  attachments: [],
}

var attachment = bot.createHero('Title','subtitle','text',[{url:'http://placeimg.com/1900/600'}],[{type:'imBack','title':'Got it','value':'acknowledged'}],{type:'openUrl',value:'http://mywebsite.com'});

reply.attachments.push(attachment);
```

*Create attachment with pre-defined object:*
```javascript
var reply = {
  text: 'Here is an attachment!',
  attachments: [],
}

var attachment = bot.createHero({
  title: 'My title',
  subtitle: 'My subtitle',
  text: 'My text',
});

reply.attachments.push(attachment);
```

*Create attachment with helper methods:*
```javascript
var reply = {
  text: 'Here is an attachment!',
  attachments: [],
}

var attachment = bot.createHero();

attachment.title('This is the title');
attachment.text('I am putting some text into a hero card');
attachment.button('imBack','Click Me','I clicked a button!');
attachment.button('openUrl','Link Me','http://website.com');
attachment.button('invoke','Trigger Event',JSON.stringify({'key':'value'}));

reply.attachments.push(attachment);
```

##### Multiple Attachments

When sending multiple attachments, you may want to specify the `attachmentLayout` attribute
of the message object. Setting `attachmentLayout` to `carousel` will cause attachments
to be displayed as a [carousel](https://msdn.microsoft.com/en-us/microsoft-teams/botsmessages#carousel-layout), while the default behavior is to use a [list layout](https://msdn.microsoft.com/en-us/microsoft-teams/botsmessages#list-layout).

##### Sample Hero Card

```
controller.hears('hero',  'direct_mention, direct_message', function(bot, message) {

  // this is a sample message object with an attached hero card
  var reply = {
    "text": "Here is a hero card:",
    "attachments": [
      {
        "contentType": "application/vnd.microsoft.card.hero",
        "content": {
          "title": "Hero card title",
          "subtitle": "Hero card subtitle",
          "text": "The text of my hero card"
          "images": [
            {
              "url": "http://placeimg.com/1600/900",
              "alt": "An image from placeimg.com"
            }
          ],
        }
      }
    ]
  };

  bot.reply(message,reply);
});
```

##### Sample Thumbnail Card

```
controller.hears('thumbnail', 'direct_mention, direct_message',  function(bot, message) {

  // this is a sample message object with an attached hero card
  var reply = {
    "text": "Here is a thumbnail card:",
    "attachments": [
      {
        "contentType": "application/vnd.microsoft.card.thumbnail",
        "content": {
          "title": "Thumbnail title",
          "subtitle": "Thumbnail subtitle",
          "text": "The text of my Thumbnail card"
          "images": [
            {
              "url": "http://placeimg.com/900/900",
              "alt": "A nice square image from placeimg.com"
            }
          ],
        }
      }
    ]
  };

  bot.reply(message,reply);
});
```

##### Sample Image Attachment

```
controller.hears('image', 'direct_mention, direct_message', function(bot, message) {

  // this is a sample message object with an attached hero card
  var reply = {
    "text": "Check out this attached image!",
    "attachments": [
      {
        "contentType": "image/png",
        "contentUrl": "http://mywebsite.com/image.png",
      }
    ]
  };

  bot.reply(message,reply);
});
```


##### Sample O365 Connector Card

TODO


### Buttons

Buttons can be included in attachments.
There are [several types of button](https://msdn.microsoft.com/en-us/microsoft-teams/botsmessages#buttons) that result in different actions.

* `openUrl` buttons cause a browser to open to a specific web url
* `invoke` buttons cause a message to be sent back to your bot application
* `imBack` buttons cause the user to "say" something back to the bot
* `messageBack` buttons cause the user to "say" something back to your bot, while displaying a different message for other users to see.

Note that is possible to send an attachment that is empty except for buttons - this can be useful!

To use buttons, build them with the [attachment helpers](#attachment-helpers),
or construct them in code and include them in your attachment objects, as seen in the examples below:

##### Sample invoke button

```
controller.hears('invoke button', function(bot, message) {
var reply =
  {
    text: 'This message has an invoke button',
    attachments: [
      {
         "contentType": "application/vnd.microsoft.card.hero",
         "content": {
           // other card fields here, see above
           // title: '...',
           // subtitle: '...',
           // ...
           "buttons": [
             {
               "type": "invoke",
               "title": "Click Me",
               "value": "{\"action\":\"click\"}"
             }
           ]
      }
    ]
  };

  bot.reply(messge, reply);
});
```


##### Sample imBack button

```
controller.hears('imback button', function(bot, message) {
var reply =
  {
    text: 'This message has an imBack  button',
    attachments: [
      {
         "contentType": "application/vnd.microsoft.card.hero",
         "content": {
           // other card fields here, see above
           // title: '...',
           // subtitle: '...',
           // ...
           "buttons": [
             {
               "type": "imBack",
               "title": "Hello!",
               "value": "hello"
             }
           ]
      }
    ]
  };

  bot.reply(messge, reply);
});
```

##### Sample openUrl button
```
controller.hears('openurl button', function(bot, message) {
var reply =
  {
    text: 'This message has an openUrl button',
    attachments: [
      {
         "contentType": "application/vnd.microsoft.card.hero",
         "content": {
           // other card fields here, see above
           // title: '...',
           // subtitle: '...',
           // ...
           "buttons": [
             {
               "type": "openUrl",
               "title": "Open Link",
               "value": "http://mywebsite.com"
             }
           ]
      }
    ]
  };

  bot.reply(messge, reply);
});
```


##### Tap Actions

In addition to buttons, developers can add a "tap action" to a card which will be
triggered when a user clicks on any part of the card - sort of like a default action.

Tap actions are defined using the same options as buttons - a [card action object](https://msdn.microsoft.com/en-us/microsoft-teams/botsmessages#card-actions)
set in the `message.tap` field:

```javascript
var attachment = {
    "contentType": "application/vnd.microsoft.card.hero",
    "content": {
      "title": "Hero card title",
      "subtitle": "Hero card subtitle",
      "text": "The text of my hero card"
      "images": [
        {
          "url": "http://placeimg.com/1600/900",
          "alt": "An image from placeimg.com"
        }
      ],
      "tap": {
        "type": "imBack",
        "value": "That tickles!"
      }
    }
  }
```

#### Handling Invoke Events

Botkit translates button clicks into `invoke` events.  To respond to button click events, create one or more handlers for the invoke event.

The message object passed in with the invoke event has a `value` field which will match the `value` specified when the button was created.

Invoke events can be replied to, or used to start conversations, just like normal message events.

```javascript
controller.on('invoke', function(bot, message) {

  // value is a user-defined object
  var value = message.value;

  // send a reply to the user
  bot.reply(messge,'You clicked a button!');

});
```

### User Mentions

Your bot can @mention another user in a message, which causes their username to be highlighted and a special notification to be sent.  Teams mentions are slightly more complex than some other platforms, and require not only a special syntax in the message itself, but also additional fields in the message object.  [See Microsoft's full docs for user mentions here](https://msdn.microsoft.com/en-us/microsoft-teams/botsinchannels#mentions).

A native Teams user mention requires BOTH:

* The `message.text` field includes the mention in the format "<at>@User Name</at>"
* The `message.entities` field includes an array element further defining the mention with the user's name and user ID.

This makes life a bit tricky, because the user name is not part of the incoming message, and requires additional API or DB calls to retrieve.
Maintaining the entities field is also annoying!

To make life easier for developers, Botkit supports an easier to use syntax by providing a translation middleware.
This allows developers to create mentions by including a modified mention syntax in the message text only, without having to also
specify the entity field. Botkit uses a "Slack-style" mention syntax: `<@USERID>`.

Using this syntax, developers can create inline mentions in response to incoming messages with much less effort:

```
controller.hears('mention me', function(bot, message) {

  bot.reply(message,'I heard you, <@' + message.user +'>!');

});
```


#### Using Compose Extensions

One of the unique features of Microsoft Teams is support for "[compose extensions](https://msdn.microsoft.com/en-us/microsoft-teams/composeextensions)" -
custom UI elements that appear adjacent to the "compose" bar in the Teams client that allow users to
create cards of their own using your bot application.

With a compose extension, you can offer users a way to search or create content in your application
which is then attached to their message. Compose extensions can live in both multi-user team chats, as well as 1:1 discussions with the bot.
They work sort of like web forms - as a user types a query, the compose extension API retrieves results from the application and displays them in
the teams UI. When a result is selected, a custom app-defined card is attached to the user's outgoing message. Compose extensions use the [same attachment format as normal messages](#working-with-attachments-and-media).

To enable a compose extension in your bot app, you must first add a configuration section to [your app's manifest file](#app-package--manifest-file).
Luckily, [Botkit Studio](http://studio.botkit.ai) has a tool for building these manifests. Using it will make your life much easier!

Once configured, whenever a user uses your compose extension, your Botkit application will receive a `composeExtension` event. Botkit automatically
makes the user's query available in the  `message.text` field, and provides a `bot.replyToComposeExtension()` function for formatting and delivering the results to Teams.
`replyToComposeExtension()` expects the response to be an array of [attachments](#working-with-attachments-and-media).

```javascript
controller.on('composeExtension', function(bot, message) {

  var query = message.text;

  my_custom_search(query).then(function(results) {

      // let's format the results an array of hero card attachments
      var attachments = [];
      for (var r = 0; r < results.length; r++) {
        var attachment = bot.createHero(results.title, results.subtitle, results.text);
        attachments.push(attachment);
      }

      // you can use the normal bot.reply function to send back the compose results!
      bot.replyToComposeExtension(message, results);

  });

});
```


#### Using Tabs

Tab applications provide the ability to display web content directly in the Teams UI.  There are a few different types of tab, and applications can contain multiple tabs. [Microsoft has extensive documentation about building tab applications](https://msdn.microsoft.com/en-us/microsoft-teams/tabs), but the short story is: your bot can include an integrated web app component that interacts with Teams in some neat ways. Microsoft provides an easy to use [Javascript library](https://msdn.microsoft.com/en-us/microsoft-teams/jslibrary) that
is used to set tab configuration options, and provide information about the user, team, and channels in which the tab is installed.

Tabs are configured in the [manifest.json](#app-package--manifest-file) as part of your app package. Read up on that, or use [Botkit Studio](https://studio.botkit.ai) to build this file.

[The Botkit Starter Kit for Microsoft Teams](https://github.com/howdyai/botkit-starter-teams) contains a complete tab application, and demonstrates the interplay between the tab and bot components. This is a great starting point, and gives you all pieces you'd otherwise have to build yourself.

The relevant information about building tabs in a Botkit application are:

* Adding new web endpoints for serving the tab application
* Linking the _bot_ user to the _tab_ user in order to share data

##### Adding Tab Endpoints to Botkit

When using the [built-in webserver](#using-the-built-in-webserver), developers
can add web endpoints to the built in Express webserver inside the `setupWebserver()` callback function.
Tabs serve normal webpages, and can live at whatever URI you specify - as long as it matches
the settings in the manifest file.

```javascript
controller.setupWebserver(3000, function(err, webserver) {
  // set up the normal webhooks to receive messages from teams
  controller.createWebhookEndpoints(webserver, function() {
      console.log("BOTKIT: Webhooks set up!");
  });

  // create a custom static tab url
  webserver.get('/static-tab', function(req, res) {
    res.send('This is my static tab url!')
  });

});
```

When using [the starter kit](https://github.com/howdyai/botkit-starter-teams),
tab urls can be added in the [components/routes/teams_tabs.js](https://github.com/howdyai/botkit-starter-teams/tree/master/components/routes) folder.

##### Linking bot users to tab users

Using the [Microsoft Teams Javascript library](https://msdn.microsoft.com/en-us/microsoft-teams/jslibrary),
developers can get access to the active user's "upn" - a user ID that identifies the user in the broader context of
Microsoft Office 365.

This is a _different user ID_ than the one used inside Teams chat . A little bit of extra work is necessary to connect the dots between these
different account identifiers.

Botkit provides a method, [bot.api.getUserByUpn()](#botapigetuserbyupn), that can be used to translate the upn value from the tab
into user id expected by Teams chat. It is also possible to translate a `message.user` field into a upn by using [bot.api.getUserById()](#botapigetuserbyid),
the results of which include the upn value.

For these reasons, we recommend using a user's `upn` value as the primary key when storing information about a user.
The following example demonstrates using `getUserById()` to load a user's upn, then use the upn to load data from
Botkit's built-in storage system. Using the storage system in this way will allow data stored in it to be used by both
the bot and the tab application.

[The starter kit](https://github.com/howdyai/botkit-starter-teams) implements this automatically using a
middleware that automatically translates the user ID into a UPN and pre-loads the user data before firing any handlers.
[This is a good reference for any customized solution.](https://github.com/howdyai/botkit-starter-teams/blob/master/skills/load_user_data.js)

```
controller.hears('save', 'direct_message', function(bot, message) {

  var value = 'special value';
  // use the microsoft teams API to load user data
  bot.api.getUserById(message.channel, message.user, function(err, user_profile) {
    // check errors
    var upn = user_profile.userPrincipalName;
    controller.storage.users.get(upn, function(err, user_data) {
        // check errors

        // if no user found, create a new record with upn as primary id
        if (!user_data) {
          user_data = {
            id: upn
          }
        }

        // update with new value
        user_data.value = value;

        // store the user
        controller.storage.users.save(user_data);    

        // send a reply
        bot.reply(message,'Saved');
    });
  });
});
```

## Developer & Support Community
Complete documentation for Botkit can be found on our [GitHub page](https://github.com/howdyai/botkit/blob/master/readme.md). Botkit Studio users can access the [Botkit Studio Knowledge Base](https://botkit.groovehq.com/help_center) for help in managing their Studio integration.

### Get Involved!
Botkit is made possible with feedback and contributions from the community. A full guide to submitting code, reporting bugs, or asking questions on [Github can be found here](https://github.com/howdyai/botkit/blob/master/CONTRIBUTING.md)

###  Need more help?
* Join our thriving community of Botkit developers and bot enthusiasts at large. Over 4500 members strong, [our open Slack group](http://community.botkit.ai) is _the place_ for people interested in the art and science of making bots.

Come to ask questions, share your progress, and commune with your peers!

* We also host a [regular meet-up called TALKABOT.](http://talkabot.ai) Come meet, present, and learn from other bot developers!

 [Full video of our 2016 conference is available on our Youtube channel.](https://www.youtube.com/playlist?list=PLD3JNfKLDs7WsEHSal2cfwG0Fex7A6aok)


## About Botkit
Botkit is a product of [Howdy](https://howdy.ai) and made in Austin, TX with the help of a worldwide community of botheads.

## Documentation

* [Get Started](readme.md)
* [Botkit Studio API](readme-studio.md)
* [Function index](readme.md#developing-with-botkit)
* [Starter Kits](readme-starterkits.md)
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
