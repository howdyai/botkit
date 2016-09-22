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
Replace '_MY SLACK TOKEN_'  with the API Token you got from Slack.

it should look something like this:
```
studio_token=fcfItRK5RtbGzBpnEVO8ygEwse2sOFBmkdkQTAEASNeoYDXQ5heP8pmkHERptvaz token=xoxb-53054538583-GO2vZLYk8qDKmuo8pMzuztKz node .
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
- On the left under 'Commands' click 'hello'.
- On the right where it says 'Hello! This is my hello script. You can edit it to customize my behaviors.' Click there. Edit the text and click 'Save'.
- Now send your bot a direct message saying 'hi'.
- It should respond with the text you changed that script to

For more on editing scripts see: [link to wherever we are going to have directions on script editor.]()

## Developing with Botkit Studio
Now that you have your development environment setup, you can begin with the task of developing your bot.

Soupme is a simple bot that can
- Read an external list of menu items
- Ask the participant to select from a list of dynamic options
- Confirm their choice and provide instructions on how to receive their item.

___
### Using the Before Middleware

The thread begins with a command to your bot: @soupme soup. Using Before Middleware we can fetch the data that will be presented to your user from an external resource. For example, if we want to display a list of soup options, along with a dynamic soup of the day option.
* Step 1: Create the 'soup' command in Botkit Studio
* Step 2: write the code in your bot that wraps it. You can use the example:
```
controller.studio.before('soup', function(convo, next){
  // get soup of the day
  var daily_special = getDailySpecial();
  convo.setVar('daily_special', daily_special);
  // get soup options
  var soup_menu = getMenu();
  convo.setVar('soup_menu', soup_menu);
  // cleanse the pallet
  convo.setVar('soup_selection', null);
  convo.setVar('selected_soup_size', null);
  next();
});
```
Assuming we have functions called getDailySpecial, and getMenu, that return some JSON formated menu items we can use ```convo.setVar()``` to set it as a variable available to the command.
The templating engine uses [mustache](https://mustache.github.io/) and any variables set are accessible in the script editor via vars. For instance those two variables would now be accessible in the script editor as ```{{vars.daily_special}}``` and ```{{vars.soup_menu}}``` You can display them using this code in your script.
* Step 3: Edit the 'soup' command in the Botkit Studio Script Editor.The user will be presented with a list of options for the soup of their choice. Add a variable called 'selected_soup' using the right collapsible menu. While we are here we should also make a 'soup_size' variable. At the end of the last question set the response to 'selected_soup'. While we are here go ahead and make a branch for when the soup is selected called 'soup_selected'. and lets make an error states while we are at it, 'invalid_soup'
we should have a screen-shot here of what the mustache template looks like in the editor.
* Step 4: Test it by direct messaging 'soup' at soupme. It should return menu of possible soups. this should also have a screen-shot.

### Using the Validate Middleware
Now that a user has been presented with a menu we want to validate their response to the question 'What would you like to order?'.
We also want to validate it against the menu, and if we find one store it for later in the conversation. Also we want to handle any human input errors here by guiding them to hopefully helpful error states. We do this with code that looks something like this:
```
controller.studio.validate('soup','selected_soup', function(convo, next) {
  var found_soup = [], possible_matches = [], soup_selection, input = convo.extractResponse('selected_soup');
  possible_matches.push(convo.vars.daily_special.name);
  convo.vars.soup_menu.forEach(function(m){
    possible_matches.push(m.name);
  });
  possible_matches.forEach(function(pm){
    var re = new RegExp('^' + input.toLowerCase() + '\\b' , 'igm');
    var found = pm.match(re);
    if(found){
      found_soup = convo.vars.soup_menu.filter(function(s){
        return s.name.toLowerCase() === pm.toLowerCase();
      });
      if(found_soup.length === 0){
        console.log(convo.vars.daily_special.name.toLowerCase(), '|', pm.toLowerCase());
        if(convo.vars.daily_special.name.toLowerCase() === pm.toLowerCase()){
          found_soup = [];
          found_soup.push(convo.vars.daily_special);
        }
      }
    }
  });
  if(found_soup.length > 0) {
    convo.setVar('soup_selection', found_soup[0]);
    convo.changeTopic('soup_selected');
  }else {
    convo.changeTopic('invalid_soup');
  }
  next();
});
```
And present a list of sub-options to determine size. There is a second validator for the second variable we need to collect. It looks something like this:
```
controller.studio.validate('soup','soup_size', function(convo, next) {
  var selected_soup_size, valid_sizes = ['small', 'medium', 'epic'], input = convo.extractResponse('soup_size');
  console.log('soup_size: ', input);
  var filtered_input = valid_sizes.filter(function(s){
    return s.toLowerCase() === input.toLowerCase();
  });
  if(filtered_input.length === 0){
    convo.changeTopic('invalid_size');
  }else if (filtered_input.length > 1) {
    convo.changeTopic('ambiguous_size');
  }else {
    selected_soup_size = filtered_input[0];
    convo.setVar('selected_soup_size', selected_soup_size);
    convo.setVar('order_confirmation', '123');
    convo.changeTopic('soup_order_complete');
  }
  next();
});
```

### Using the After Middleware
Then we can confirm with the user that the script has their correct order, and provide instructions on how to retrieve their physical order, using following code:
```
controller.studio.after('soup', function(convo, next) {
  if (convo.status == 'completed' && convo.vars.soup_selection && convo.vars.selected_soup_size) {
    console.log('--------------------------- soup order finished ----------------------------------');
    console.log('Generated a soup order for', convo.context.user, ' who ordered a', convo.vars.selected_soup_size, ' sized ', convo.vars.soup_selection.name, ' with a confirmation number of ', convo.vars.order_confirmation);
    console.log('Get started with the soup!');
    next();
  }else {
    next();
  }

});
```
This will also leave an order in the terminal. That could be piped to a database or API somewhere if you wanted to build a real one.

## Accessing Botkit Studio from your bot
___

### controller.studio.run()
| Argument | Description
|---  |---
| bot   | A bot instance
| input_text | The name of a script defined in Botkit Studio
| user | the user id of the user having the conversation
| channel | the channel id where the conversation is occurring

`controller.studio.run()` will load a script defined in the Botkit Studio authoring tool, convert it into a Botkit conversation, and perform the conversation to it's completion.

Developers may tap into the conversation as it is conducted using the [before](#controllerstudiobefore), [after](#controllerstudioafter), and [validate](#controllerstudiovalidate) hooks. It is also possible to bind to the normal `convo.on('end')` event because this function also returns the resulting conversation object via a promise:

```
controller.studio.run(bot, 'hello', message.user, message.channel).then(function(convo) {
    convo.on('end', function(convo) {
        if (convo.status=='completed') {
            // handle successful conversation
        } else {
            // handle failed conversation
        }
    });
});
```

### controller.studio.get()
| Argument | Description
|---  |---
| bot   | A bot instance
| input_text | The name of a script defined in Botkit Studio
| user | the user id of the user having the conversation
| channel | the channel id where the conversation is occurring

`controller.studio.get()` is nearly identical to `controller.studio.run()`, except that instead of automatically and immediately starting the conversation, the function returns it in a dormant state.  

While developers may still tap into the conversation as it is conducted using the [before](#controllerstudiobefore), [after](#controllerstudioafter), and [validate](#controllerstudiovalidate) hooks, it must first be activated using `convo.activate()` in the results of the promise returned by the function.

This enables developers to add template variables to the conversation object before it sends its first message. Read about [using variables in messages](readme.md#using-variable-tokens-and-templates-in-conversation-threads)

```
controller.studio.run(bot, 'hello', message.user, message.channel).then(function(convo) {
    convo.setVar('date', new Date()); // available in message text as {{vars.date}}
    convo.setVar('news', 'This is a news item!'); // ailable as {{vars.news}}

    // crucial! call convo.activate to set it in motion
    convo.activate();
});
```


### controller.studio.runTrigger()
| Argument | Description
|---  |---
| bot   | A bot instance
| input_text | The name of a script defined in Botkit Studio
| user | the user id of the user having the conversation
| channel | the channel id where the conversation is occurring

In addition to storing the content and structure of conversation threads, developers can also use Botkit Studio to define and maintain the trigger phrases and patterns that cause the bot to take actions. `controller.studio.runTrigger()` takes _arbitrary input text_ and evaluates it against all existing triggers configured in a bot's account. If a trigger is matched, the script data is returned, compiled, and executed by the bot.

This is different than `studio.run()` and `studio.get()` in that the input text may include _additional text_ other than an the exact name of a script. In most cases, `runTrigger()` will be configured to receive all messages addressed to the bot that were not otherwise handled, allowing Botkit Studio to be catch-all. See below:

```
// set up a catch-all handler that will send all messages directed to the bot
// through Botkit Studio's trigger evaluation system
controller.on('direct_message,direct_mention,mention', function(bot, message) {
    controller.studio.runTrigger(bot, message.text, message.user, message.channel).catch(function(err) {
        bot.reply(message, 'I experienced an error with a request to Botkit Studio: ' + err);
    });
});
```

In order to customize the behavior of scripts triggered using `runTrigger()`, developers define `before`, `after` and `validate` hooks for each script. See docs for these functions below.

Another potential scenario for using `runTrigger()` would be to trigger a script that includes additional parameters that would normally be provided by a user, but are being provided instead by the bot. For example, it is sometimes useful to trigger another script to start when another script has ended.

```
controller.hears(['checkin'], 'direct_message', function(bot, message) {

    // when a user says checkin, we're going to pass in a more complex command to be evaluated

    // send off a string to be evaluated for triggers
    // assuming a trigger is setup to respond to `run`, this will work!
    controller.studio.runTrigger(bot, 'run checkin with ' + message.user, message.user, message.channel);
});
```

#### A note about handling parameters to a trigger

While Botkit does not currently provide any built-in mechanisms for extracting entities or parameters from the input text, that input text remains available in the `before` and `after` hooks, and can be used by developers to process this information.

The original user input text is available in the field `convo.source_message.text`. An example of its use can be see in the [Botkit Studio Starter bot](https://github.com/howdyai/botkit-studio-starter), which extracts a parameter from the help command.

```
controller.studio.before('help', function(convo, next) {

    // is there a parameter on the help command?
    // if so, change topic.
    if (matches = convo.source_message.text.match(/^help (.*)/i)) {
        if (convo.hasThread(matches[1])) {
            convo.gotoThread(matches[1]);
        }
    }

    next();

});
```

### controller.studio.before()
| Argument | Description
|---  |---
| script_name   | The name of a script defined in Botkit Studio
| hook_function | A function that accepts (convo, next) as parameters

Define `before` hooks to add data or modify the behavior of a Botkit Studio script _before_ it is activated. Multiple before hooks can be defined for any script - they will be executed in the order they are defined.

Note: hook functions _must_ call next() before ending, or the script will stop executing and the bot will be confused!

```
// Before the "tacos" script runs, set some extra template tokens like "special" and "extras"
controller.studio.before('tacos', function(convo, next) {

    convo.setVar('special', 'Taco Boats');
    convo.setVar('extras', [{'name': 'Cheese'}, {'name': 'Lettuce'}]);

    next();

});
```


### controller.studio.after(command_name, function)
| Argument | Description
|---  |---
| script_name   | The name of a script defined in Botkit Studio
| hook_function | A function that accepts (convo, next) as parameters

Define `after` hooks capture the results, or take action _after_ a Botkit Studio script has finished executing. Multiple after hooks can be defined for any script - they will be executed in the order they are defined.

Note: hook functions _must_ call next() before ending, or the script will stop executing and the bot will be confused!

```
// After the "tacos" command is finished, collect the order data
controller.studio.after('tacos', function(convo, next) {
    if (convo.status == 'completed') {
        var responses = convo.extractResponses();
        // store in a database
    }
    next();
});
```


### controller.studio.validate(command_name, variable_name, function)
| Argument | Description
|---  |---
| script_name   | The name of a script defined in Botkit Studio
| variable_name | The name of a variable defined in Botkit Studio
| hook_function | A function that accepts (convo, next) as parameters

`validate` hooks are called whenever a Botkit Studio script sets or changes the value of a variable that has been defined as part of the script.

Note: hook functions _must_ call next() before ending, or the script will stop executing and the bot will be confused!

```
// Validate a "sauce" variable in the "taco" script
// this will run whenever the sauce variable is set and can be used to
// alter the course of the conversation
controller.studio.validate('tacos', 'sauce', function(convo, next) {

    var sauce = convo.extractResponse('sauce');
    sauce = sauce.toLowerCase();

    if (sauce == 'red' || sauce == 'green' || sauce == 'cheese') {
        convo.setVar('valid_sauce', true);
        next();
    } else {
        convo.gotoThread('wrong_sauce');
        next();
    }

});
```

## Hosting
___
We suggest Digital Ocean
