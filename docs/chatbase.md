# How to integrate @google/chatbase in your Botkit app

Chatbase is a new platform for Analyzing and optimizing bots more easily, regardless of how bots are built or deployed.

### Get Your API KEY : 

First, visit [Chatbase](https://chatbase.com). Then, create a new app in a couple minutes.

![alt text](https://cloud.google.com/blog/big-data/2017/11/images/6333694521376768/df-chatbase-1.png)

You will use this API_KEY in your integrations. 

### Install Via NPM

``` npm install --save @google/chatbase ```

### Require the client in your application:

``` var chatbase = require('@google/chatbase'); ```

### Create a new message with chatbase and store analytics :

```
let msg = chatbase.newMessage('6fe3effe-5219-48e7-ae13-dd3fdebf0cf8', '<USER_ID>')
    .setAsTypeUser() // sets the message as type user
    .setAsTypeAgent() // sets the message as type agent
    // WARNING: setTimestamp() should only be called with a Unix Epoch with MS precision
    .setTimestamp(Date.now().toString()) // Only unix epochs with Millisecond precision
    .setPlatform('<PLATFORM>') // sets the platform to the given value
    .setMessage('<MY_MESSAGE>') // the message sent by either user or agent
    .setIntent('<INTENT_LABEL>') // the intent of the sent message (does not have to be set for agent messages)
    .setAsHandled() // set the message as handled -- this means the bot understood the message sent by the user
    .setVersion('1.0') // the version that the deployed bot is
    .setUserId('<USER_ID>') // a unique string identifying the user which the bot is interacting with
    .setAsFeedback() // sets the message as feedback from the user
    .setAsNotFeedback() // sets the message as a regular message -- this is the default
    .setMessageId('mid.jkfk45612') // the id of the message, this is optional
    .send()
    .then(msg => console.log(msg.getCreateResponse()))
    .catch(err => console.error(err));
```

### Result : 

```{ message_id: '1921127891', status: 200 } ```

# View analytics :

Results can be visualized with the platforms. Here's an example given by Chatbase team. 

![alt text](https://tctechcrunch2011.files.wordpress.com/2017/11/blog-img-1.png)

Simply read Charts are given. They help bot developers and owners decide about :
- Users' activity
- Users' engagement
- Most used intents
- Dialog flows
- Sessions
- ...
