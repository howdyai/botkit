let chatbase = require('@google/chatbase');

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

//result : { message_id: '1921127891', status: 200 }
