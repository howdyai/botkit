# Getting started with Botkit Studio
___
## Making Your first Slack Bot
___
First go to https://api.slack.com/bot-users and follow the prompts for 'new bot user integration'.
When you are done you should have a bot that you can give a name and it should provide you with an API Token.
That API Token is your Slack Token
Download the Botkit Studio Starter Kit at: https://github.com/xoxco/botkit-studio-starter
Register for access to Botkit Studio at: https://studio.botkit.ai/signup
Confirm your access via email.
Select or create a bot you wish to modify, you get one by default.
Click the 'API' link on the left.
Copy the contents in the field to the right of 'Use this with Botkit!'.
Open a Terminal and paste the contents of that field into it.
Replace _MY SLACK TOKEN_  with the API Token you got from Slack.
it should look something like this:
```
studio_token=fcfItRK5RtbGzBpnEVO8ygEwse2sOFBmkdkQTAEASNeoYDXQ5heP8pmkHERptvaz token=xoxb-53054538583-GO2vZLYk8qDKmuo8pMzuztKz node pro_bot.js
```
Execute the Terminal command line.
You should recieve some feedback that looks like this
```
info: ** Using simple storage. Saving data to ./db
info: ** Setting up custom handlers for processing Slack messages
info: ** API CALL: https://slack.com/api/rtm.start
notice: ** BOT ID: notstatsbot ...attempting to connect to RTM!
notice: RTM websocket opened
```
If so you have successfully launched your Slack bot. In Slack send it a direct message saying 'hi'. It should respond with 'Hello! This is my hello script. You can edit it to customize my behaviors.'

## Customizing Scripts
___
Go to https://studio.botkit.ai and log in.
Click the appropriate bot.
On the left under 'Commands' click 'hello'.
On the right where it says 'Hello! This is my hello script. You can edit it to customize my behaviors.' Click there. Edit the text and click 'Save'.
Now send your bot a direct message saying 'hi'.
It should respond with the text you changed that script to
For more on editing scripts see: [link to wherever we are going to have directions on script editor.]

## Developing with Botkit Studio
___
### Using the Before Middleware
If you wanted to pre-load some data or do something before before a script runs you can use the Before Middleware.
Below is a simple example:
```
controller.studio.before('run', function(convo, next){

  next();
});
```

### Using the Validate Middleware

### Using the After Middleware

Should we cover any of the other functionality here?

## Hosting
___
We suggest Digital Ocean
