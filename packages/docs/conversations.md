# Botkit Conversations

Botkit's core SDK ships with a Botkit-friendly dialog class called [BotkitConversation](reference/core.md#botkitconversation). This class offers developers a familiar syntax for creating scripted dialogs,
and injecting dynamic behaviors. 

Dialogs are created using functions like [convo.ask()](reference/core.md#ask) and [convo.say()](reference/core.md#say-1), and dynamic actions can be implemented using a hook system ([convo.before()](reference/core.md#before), [convo.after()](reference/core.md#after) and [convo.onChange()](reference/core.md#onchange)) that provides conversation context and a `bot` worker object at key points in the dialog's execution.

## Import the class

To use BotkitConversations, make sure to import the class along with Botkit:

```javascript
const { Botkit, BotkitConversation } = require('botkit');
```

## Anatomy of a Botkit Conversation

The `BotkitConversation` class is an implementation of the [BotBuilder Dialog base class](https://npmjs.com/package/botbuilder-dialogs) that provides a fluent interface for defining the structure and content of an interactive dialog. 

BotkitConversations are constructed from one or more sequences of messages known as "[threads](#conversation-threads)." The threads can be linked to one another, and conditional branches and loops can be created. Each item in a thread is a message template - they can include variable tokens that will be replaced with live values automatically before being sent. [Read about constructing a dialog here &rarr;](#build-a-conversation)

All dialogs must be defined and added to the Botkit controller _at start time._ It is bad practice to create new dialogs from within handler functions or in response to user actions - this may cause your bot to lose its place in the conversation, or become confused. Think about it this way: your bot has to know every possible dialog and action it might take at start time so that it can consistently respond across multiple instances of the application, or between restarts.

Like all conversations, those conducted by your bot have a beginning, middle and an end. Botkit provides ways to hook into all of these events to make your dialog more dynamic and useful:

### Beginning

BotkitConversations start on the first message of the "default" thread, and proceed through the chain of messages.

However, before it starts sending messages, Botkit will first fire any functions bound to the "default" thread using the [before()](reference/core.md#before) hook. These functions can create or change variables, and take other necessary actions - for example, looking up values in a database or external API for use in the conversation.

The bot will continue to process messages in the thread until it reaches a prompt, an action, or the end of the thread.

### Middle

As each message is read from the dialog script and sent to the user, it is evaluated for template variables. Variables may be used in almost any field in the message object. [Learn more about using variables &rarr;](#using-variable-tokens-and-templates-in-conversation-threads)

When a prompt is encountered, the message will first be sent to the user. The bot will then wait for the next message to arrive.  When it does, the value of the incoming message will automatically be captured into a variable, and any [onChange()](reference/core.md#onchange) functions that have been bound to that variable will fire. These handler functions can be used to validate the incoming value, or take other conditional actions based on the user input.

After `onChange` hooks fire, Botkit will proceed to evaluate the handler function or conditional tests that were passed in to `ask()` or `addQuestion()`. These functions may set variables, or modify the flow of the dialog by calling [repeat()](reference/core.md#repeat) or [gotoThread()](reference/core.md#gotothread).

Hook functions can be bound to the beginning of _each thread_ using [before()](reference/core.md#before). Each thread will fire it's own `before` hooks _before_ sending the first message. This can be used for a variety of purposes, including conditionally skipping a thread (by calling `gotoThread()` from inside a `before()` hook).

### End

When the dialog reaches its end (no messages remaining to be sent, or one of the end actions called), it will fire its last set of hooks, and then finally come to an end.  The end of a conversation can be thought of in the same light as a web form "submit" -- all of the user responses and any other information collected during the course of the conversation will be sent to the final hook for processing.  Commonly, these hooks are used to store/submit that information, and then possibly to begin the next dialog.

There are several ways to register an end-of-conversation hook, [discussed in more detail here &rarr;](#handling-end-of-conversation)

## Build a Conversation

First, create the new dialog object. Each dialog must have it's own unique identifier that will be used to invoke it later:

```javascript
const MY_DIALOG_ID = 'my-dialog-name-constant';
let convo = new BotkitConversation(MY_DIALOG_ID, controller);
```

Then, using the helper methods like `say()` and `ask()`, define a series of messages, questions and actions that will be taken:

| Method | Description
|--- |---
| [say()](reference/core.md#say-1) | Add a normal message template to the default thread
| [ask()](reference/core.md#ask) | Add a questin/prompt to the default thread
| [addMessage()](reference/core.md#addmessage) | Add a message template to a thread
| [addQuestion()](reference/core.md#addquestion) | Add a question/prompt to a thread
| [addAction()](reference/core.md#addaction) | Add an action (or instructions to switch threads) to a thread
| [addChildDialog()](reference/core.md#addchilddialog) |  Add a child-dialog to a thread
| [addGotoDialog()](reference/core.md#addgotodialog) | Add instructions to jump to another dialog

```javascript
// send a greeting
convo.say('Howdy!');

// ask a question, store the response in 'name'
convo.ask('What is your name?', async(response, convo, bot) => {
    console.log(`user name is ${ response }`);
    // do something?
}, 'name');

// use add action to switch to a different thread, defined below...
convo.addAction('favorite_color');

// add a message and a prompt to a new thread called `favorite_color`
convo.addMessage('Awesome {{vars.name}}!', 'favorite_color');
convo.addQuestion('Now, what is your favorite color?', async(response, convo, bot) => {
    console.log(`user favorite color is ${ response }`);
},'color', 'favorite_color');

// go to a confirmation
convo.addAction('confirmation' ,'favorite_color');

// do a simple conditional branch looking for user to say "no"
convo.addQuestion('Your name is {{vars.name}} and your favorite color is {{vars.color}}. Is that right?', [
    {
        pattern: 'no',
        handler: async(response, convo, bot) => {
            // if user says no, go back to favorite color.
            await convo.gotoThread('favorite_color');
        }
    },
    {
        default: true,
        handler: async(response, convo, bot) => {
            // do nothing, allow convo to complete.
        }
    }
], 'confirm', 'confirmation');
```

Finally, make sure to add the dialog to the Botkit controller. This activates the dialog and makes it available to use later:

```javascript
controller.addDialog(convo);
```

## Trigger Conversations

* [beginDialog()](reference/core.md#beginDialog)
* [addChildDialog()](reference/core.md#addchilddialog)
* [addGotoDialog()](reference/core.md#addgotodialog)

## Hooks

* [before()](reference/core.md#before)
* [onChange()](reference/core.md#onchange)
* [after()](reference/core.md#after)

## Conversation Threads

Complex conversations that require branching, repeating or looping sections of dialog,
or data validation can be handled using feature of the conversations we call `threads`.

Threads are pre-built chains of dialog between the bot and end user that are built before the conversation begins. Once threads are built, Botkit can be instructed to navigate through the threads automatically, allowing many common programming scenarios such as yes/no/quit prompts to be handled without additional code.

You can build conversation threads in code, or you can use [Botkit CMS](https://github.com/howdyai/botkit-cms)'s script management tool to build them in a friendly web environment and then import them dynamically to the application with [botkit-plugin-cms](plugins/cms.md). Conversations you build yourself and conversations managed in Botkit CMS work the same way -- they run inside your bot and use your code to manage the outcome.

If you've used the conversation system at all, you've used threads - you just didn't know it. When calling `convo.say()` and `convo.ask()`, you were actually adding messages to the `default` conversation thread that is activated when the conversation object is created.

## Automatically Switch Threads using Actions

You can direct a conversation to switch from one thread to another by using [addAction()](reference/core.md#addaction), or
by including the `action` field on a message object. Botkit will switch threads immediately after sending the message.

```javascript
// first, define a thread called `next_step` that we'll route to...
convo.addMessage({
    text: 'This is the next step...',
},'next_step');


// send a message, and tell botkit to immediately go to the next_step thread
convo.addMessage({
    text: 'Anyways, moving on...',
    action: 'next_step',
});
```

Developers can create complex conversational systems by combining these message actions with conditionals in `ask()` and `addQuestion()`. Actions can be used to specify default or next step actions, while conditionals can be used to route between threads.

From inside a prompt handler function, use `convo.gotoThread()` to instantly switch to a different part of the conversation. Botkit can be set to automatically navigate between threads based on user input, such as in the example below.

```javascript
    let convo = new BotkitConversation('cheese', controller);

    // create a path for when a user says YES
    convo.addMessage({
            text: 'You said yes! How wonderful.',
    },'yes_thread');

    // create a path for when a user says NO
    convo.addMessage({
        text: 'You said no, that is too bad.',
    },'no_thread');

    // create a path where neither option was matched
    // this message has an action field, which directs botkit to go back to the `default` thread after sending this message.
    convo.addMessage({
        text: 'Sorry I did not understand.',
        action: 'default',
    },'bad_response');

    // Create a yes/no question in the default thread...
    convo.addQuestion('Do you like cheese?', [
        {
            pattern: 'yes',
            handler: async function(response, convo, bot) {
                await convo.gotoThread('yes_thread');
            },
        },
        {
            pattern: 'no',
            handler: async function(response, convo, bot) {
                await convo.gotoThread('no_thread');
            },
        },
        {
            default: true,
            handler: async function(response, convo, bot) {
                await convo.gotoThread('bad_response');
            },
        }
    ],'likes_cheese','default');

    controller.addDialog(convo);
});
```

## Special Actions

In addition to routing from one thread to another using actions, you can also use
one of a few reserved words to control the conversation flow.

Set the action field of a message to `complete` to end the conversation immediately and mark as success.

Set the action field of a message to `stop` end immediately, but mark as failed.

Set the action field of a message to `timeout` to end immediately and indicate that the conversation has timed out.

After the conversation ends, these values will be available in the `_status` field of the results parameter. This field can then be used to check the final outcome of a conversation. See [handling the end of conversations](#handling-end-of-conversation).

## Using Variable Tokens and Templates in Conversation Threads

Pre-defined conversation threads are great, but many times developers will need to inject dynamic content into a conversation.
Botkit achieves this by processing the text of every message using the [Mustache template language](https://mustache.github.io/).
Mustache offers token replacement, as well as access to basic iterators and conditionals.

Variables can be added to a conversation at any point after the conversation object has been created using the function `convo.setVar()`. See the example below.

```javascript
    // .. define threads which will use variables...
    // .. and then, set variable values:
    convo.setVar('foo','bar');
    convo.setVar('list',[{value:'option 1'},{value:'option 2'}]);
    convo.setVar('object',{'name': 'Chester', 'type': 'imaginary'});
});
```

Given the variables defined in this code sample, `foo`, a simple string, `list`, an array, and `object`, a JSON-style object,
the following Mustache tokens and patterns would be available:

```
The value of foo is {{vars.foo}}

The items in this list include {{#vars.list}}{{value}}{{/vars.list}}

The object's name is {{vars.object.name}}.
```

Botkit ensures that your template is a valid Mustache template, and passes the variables you specify directly to the Mustache template rendering system.
Our philosophy is that it is OK to stuff whatever type of information your conversation needs into these variables and use them as you please!

## Dynamic Text, Quick Replies and Attachments

In some cases, developers will need to create dynamic quick replies and/or attachments to the messages within an otherwise pre-scripted dialog.
As of Botkit v4.5, this can be achieved by specifying a function responsible for generating this content as part of the message template.

Functions may be passed in in the `text`, `quick_replies`, `attachment`, `attachments` and `blocks` fields.  All of these functions share the same signature:
`async(message_template, vars) => { return CONTENT; }`

The `message_template` parameter includes the entire template initially passed in to `ask()` or `say()` or any other function used to construct the dialog structure.

The `vars` parameter includes all of the currently available conversation variables otherwise accessible via `convo.vars` and/or the `{{vars.name}}` syntax.

These two variables, along with any other information currently in scope, can be used to dynamically generate these attachments, as seen in the example below:

```
let dialog = new BotkitConversation('sample_dialog', controller);

dialog.ask('What would you like the quick reply to say?', [], 'reply_title');
dialog.say({
    text: 'Here is your dynamic button:',
    quick_replies: async(template, vars) => { return [{title: vars.reply_title, payload: vars.reply_title }]}
});
```

These generator functions are responsible for creating the attachment content in the platform-appropriate format.  The returned content may include `{{vars.name}}` style Mustache tags.

## Conversation Control Functions

When a user responds to a prompt, the answer is automatically added to the list of variables.
Then, any conditionals or handler functions associated with the prompt will be fired.

All the conditions will be tested in the order they are specified in code. If no other condition matches, Botkit will fire the handler that includes `default: true`.
For the winning condition, the handler function will fire. The handler receives 3 parameters: the raw response to the prompt, a [convo helper object](reference/core.md#botkitdialogwrapper), 
and a [bot worker](reference/core.md#botworker).

Several helper functions are available in order to direct the flow of the conversation from within the handler:

* [convo.repeat()](reference/core.md#repeat)
* [convo.setVar()](reference/core.md#setvar)
* [convo.gotoThread()](reference/core.md#gotothread)

## Composing Dialogs

Multiple dialogs can be combined into larger, more complex interactions. The results of "child" dialogs roll up to the "parent" dialog.

To use a child dialog, add a pointer to it to the parent dialog using [addChildDialog()](reference/core.md#addchilddialog). Then, at the appropriate place in the performance of the parent dialog, the bot will switch automatically to the child dialog, run it to completion, then resume the parent dialog where it left off. The results of the child dialog (any variables or user responses captured) will be stored in the parent dialog's variable set.

```javascript
let parent = new BotkitConversation(PARENT_ID, controller);
let child = new BotkitConversation(CHILD_ID, controller);

parent.say('I have a few questions...');
parent.addChildDialog(CHILD_ID, 'answers'); // capture responses in vars.questions

child.ask('Question 1!',[], 'question_1'); // no handler
child.ask('Question 2!',[], 'question_2'); // no handler
child.ask('Question 3!',[], 'question_3'); // no handler

controller.addDialog(parent);
controller.addDialog(child);
controller.afterDialog(parent, async(bot, results) => {

    let question_1 = results.answers.question_1;
    let question_2 = results.answers.question_2;
    // ... do stuff with responses

});
```

## Handling End of Conversation

Any dialog - not just `BotkitConversations`, but any [dialog built on the BotBuilder dialog base class](https://npmjs.com/package/botbuilder-dialogs) - will emit a special event whenever it completes that can be handled using [afterDialog()](reference/core.md#afterdialog). Each handler function will receive an object containing all of the variables set and/or collected during the course of the conversation, and a [bot worker](reference/core.md#botworker) object that can take further actions.

Conversations end naturally when the last message has been sent and no messages remain in the queue.
In this case, the value of `results._status` will be `completed`. Other values for this field include `canceled`, and `timeout`.

```javascript
const my_dialog = new BotkitDialog('dialog', controller);
my_dialog.ask('What is your name?', [], 'name');
controller.addDialog(my_dialog);

controller.afterDialog(my_dialog, async(bot, results) => {

    // use results of dialog here
    let name = results.name;

    // do some cool database stuff here

    // start next dialog
    await bot.beginDialog(NEXT_DIALOG);

});
```

When constructing `BotkitConversation` dialogs, it may be easier to define the end-of-conversation handler directly on the dialog object using [after()](reference/core.md#after).  This is an equivalent method of binding the handler, though the order of the parameters _is reversed here_ with the first parameter being containing the dialog results instead of the second.

Note that this syntax is only supported by BotkitConversation, so it when using a mix of dialog types, it may be better to standardize on the `afterDialog()` syntax.

```javascript
convo.after(async(results, bot) => {
    // TODO
    if (results._status === 'completed') {
        // any variable set with convo.setVar
        // and any response to convo.ask or convo.addQuestion
        // is present as results[keyname]

        // can do things like
        // await bot.beginDialog(NEXT_DIALOG);
    }
});
```
