# Botkit Conversations

Botkit's core SDK ships with a Botkit-friendly dialog class called [BotkitConversation](reference/core.md#botkitconversation). This class offers developers a familiar syntax for creating scripted dialogs,
and injecting dynamic behaviors. 

Dialogs are created using functions like [convo.ask()](reference/core.md#ask) and [convo.say()](reference/core.md#say-1), and dynamic actions can be implemented using a hook system ([convo.before()](reference/core.md#before), [convo.after()](reference/core.md#after) and [convo.onChange()](reference/core.md#onchange)) that provides conversation context and a `bot` worker object at key points in the dialog's execution.

## Import the class

To use BotkitConversations, make sure to import the class along with Botkit:

```javascript
const { Botkit, BotkitConversation } = require('botkit';
```

## Anatomy of a Botkit Conversation

The `BotkitConversation` class is an implementation of the [BotBuilder Dialog base class](https://npmjs.com/package/botbuilder-dialogs) that provides a fluent interface for defining the structure and content of an interactive dialog. Note that the following information is specific to BotkitConversations, and does not apply to other dialog types like `WaterfallDialog` that, while compatible with Botkit, do not have all of the same features.

BotkitConversations are constructed from one or more sequences of messages known as "[threads](#conversation-threads)." The threads are linked to one another through special conditional actions that can be part of an `ask()` prompt, or defined directly in the thread using `addAction()`. Each item in a thread is actually a message template - they can include variable tokens that will be replaced with live values automatically before being sent. [Read about constructing a dialog here &rarr;](#build-a-conversation)

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

## Build A Conversations

First, create the new dialog object. Each dialog must have it's own unique identifier that will be used to invoke it later:

```javascript
const MY_DIALOG_ID = 'my-dialog-name-constant';
let convo = new BotkitConversation(MY_DIALOG_ID, controller);
```

Then, using the helper methods like `say()` and `ask()`, define a series of messages, questions and actions that will be taken:

* [say()](reference/core.md#say-1)
* [ask()](reference/core.md#ask)
* [addMessage()](reference/core.md#addmessage)
* [addQuestion()](reference/core.md#addquestion)
* [addAction()](reference/core.md#addaction)
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

You can build conversation threads in code, or you can use [Botkit CMS](https://github.com/howdyai/botkit-cms)'s script management tool to build them in a friendly web environment and then import then dynamically to the application with [botkit-plugin-cms](plugins/cms.md). Conversations you build yourself and conversations managed in Botkit CMS work the same way -- they run inside your bot and use your code to manage the outcome.

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
    let convo = new BotkitConversation(controller, 'cheese');

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
    ],{key: 'likes_cheese'},'default');

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

## Conversation Control Functions

In order to direct the flow of the conversation, several helper functions
are provided.  These functions should only be called from within a handler function passed to [ask()] (reference/core.md#ask)  or [addQuestion()](reference/core.md#addquestion)

* [convo.repeat()](reference/core.md/#repeat)
* [convo.setVar()](reference/core.md#setvar)
* [convo.gotoThread()](reference/core.md#gotothread)

## Handling End of Conversation

Conversations end naturally when the last message has been sent and no messages remain in the queue.
In this case, the value of `results._status` will be `completed`. Other values for this field include `canceled`, and `timeout`.

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