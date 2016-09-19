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
Now that you have your development environment setup, you can begin with the task of developing your bot. Soupme is a simple bot that can
-Read an external list of menu items
-Ask the participant to select from a list of dynamic options
-Confirm their choice and provide instructions on how to receive their item.

___
### Using the Before Middleware

The thread begins with a command to your bot: @soupme soup. Using Before Middleware we can fetch the data that will be presented to your user from an external resource. For example, if we want to display a list of soup options, along with a dynamic soup of the day option.
Step 1: Create the Command in Botkit Studio
Step 2: write the code in your bot that wraps it. You can use the example:
```
controller.studio.before('soup', function(convo, next){
  // get soup of the day
  var daily_special = getDailySpecial();
  convo.setVar('daily_special', daily_special);
  // get soup options
  var soup_menu = getMenu();
  convo.setVar('soup_menu', soup_menu);
  next();
});
```
Assuming we have functions called getDailySpecial, and getMenu, that return some JSON formated menu items we can use ```convo.setvars``` to set it as a variable available to the command.
The templating engine uses [mustache](https://mustache.github.io/) and any variables set are accessible in the script editor via vars. For instance those two variables would now be accessible in the script editor as ```{{vars.daily_special}}``` and ```{{vars.soup_menu}}```
You can display them using this code in your script.
The user will be presented with a list of options for the soup of their choice.

### Using the Validate Middleware
Once a user selects their soup, you will want to validate their choice:

And present a list of sub-options to determine size:

### Using the After Middleware
Then we can confirm with the user that the script has their correct order, and provide instructions on how to retrieve their physical order, using following code:

Should we cover any of the other functionality here?

## Hosting
___
We suggest Digital Ocean
