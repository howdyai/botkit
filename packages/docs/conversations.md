# Botkit Conversations

Botkit's core SDK ships with a Botkit-friendly dialog class called [BotkitConversation](reference/core.md#botkitconversation). This class offers developers a familiar syntax for creating scripted dialogs,
and injecting dynamic behaviors. 

Dialogs are created using functions like [convo.ask()](reference/cms.md#ask) and [convo.say()](reference/cms.md#say), and dynamic actions can be implemented using a hook system ([convo.before()](reference/core.md#before), [convo.after()](reference/core.md#after) and [convo.onChange()](reference/core.md#onchange)) that provides conversation context and a `bot` worker object at key points in the dialog's execution.

### Conversation Threads

Complex conversations that require branching, repeating or looping sections of dialog,
or data validation can be handled using feature of the conversations we call `threads`.

Threads are pre-built chains of dialog between the bot and end user that are built before the conversation begins. Once threads are built, Botkit can be instructed to navigate through the threads automatically, allowing many common programming scenarios such as yes/no/quit prompts to be handled without additional code.

You can build conversation threads in code, or you can use [Botkit CMS](https://github.com/howdyai/botkit-cms)'s script management tool to build them in a friendly web environment and then import then dynamically to the application with [botkit-plugin-cms](plugins/cms.md). Conversations you build yourself and conversations managed in Botkit CMS work the same way -- they run inside your bot and use your code to manage the outcome.

If you've used the conversation system at all, you've used threads - you just didn't know it. When calling `convo.say()` and `convo.ask()`, you were actually adding messages to the `default` conversation thread that is activated when the conversation object is created.

### Automatically Switch Threads using Actions

You can direct a conversation to switch from one thread to another automatically
by including the `action` field on a message object. Botkit will switch threads immediately after sending the message.

```javascript
// first, define a thread called `next_step` that we'll route to...
convo.addMessage({
    text: 'This is the next step...',
},'next_step');


// send a message, and tell botkit to immediately go to the next_step thread
convo.addMessage({
    text: 'Anyways, moving on...',
    action: 'next_step'
});
```

Developers can create fairly complex conversational systems by combining these message actions with conditionals in `ask()` and `addQuestion()`.  Actions can be used to specify
default or next step actions, while conditionals can be used to route between threads.

From inside a handler function, use `convo.gotoThread()` to instantly switch to a different pre-defined part of the conversation. Botkit can be set to automatically navigate between threads based on user input, such as in the example below.

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
            handler: function(response, convo) {
                await convo.gotoThread('yes_thread');
            },
        },
        {
            pattern: 'no',
            handler: function(response, convo) {
                await convo.gotoThread('no_thread');
            },
        },
        {
            default: true,
            handler: function(response, convo) {
                await convo.gotoThread('bad_response');
            },
        }
    ],{key: 'likes_cheese'},'default');

    controller.addDialog(convo);
});
```

### Special Actions

In addition to routing from one thread to another using actions, you can also use
one of a few reserved words to control the conversation flow.

Set the action field of a message to `complete` to end the conversation immediately and mark as success.

Set the action field of a message to `stop` end immediately, but mark as failed.

Set the action field of a message to `timeout` to end immediately and indicate that the conversation has timed out.

After the conversation ends, these values will be available in the `_status` field of the results parameter. This field can then be used to check the final outcome of a conversation. See [handling the end of conversations](#handling-end-of-conversation).

### Using Variable Tokens and Templates in Conversation Threads

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

### Conversation Control Functions

In order to direct the flow of the conversation, several helper functions
are provided.  These functions should only be called from within a [ask()](reference/cms.md#ask)
handler function.

`convo.repeat()` repeat the last question sent and continue to wait for a response.

`convo.setVar()`

`convo.gotoThread()`


### Handling End of Conversation

Conversations trigger events during the course of their life.  Currently,
only two events are fired, and only one is very useful: end.

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