# Botkit Tasks

Tasks and conversations are the system by which Botkit handles multi-message
interactions with users.

A task is started as part of a event handler.  The task is linked to the
original sender and channel from which the task was initiated.

A task contains one or more conversations.  When a task is created, the
first conversation is also automatically created.

Messages and questions can then be added to a conversation. Multiple messages
can be added to a conversation - they will be sent one at a time in the order
that they are added.

Additional conversations (with other users, in different channels) can be added
to the task using `task.startConversation()`.  See also `bot.startDM`, which
starts a direct message conversation and adds it to an existing task.

Tasks and conversations throw 'end' events that can be handled. Conversations
end when all messages have been sent.  Tasks end when all child conversations have
ended.

Create a task to handle one or more conversations with users
bot.startTask()

Once a task is started, additional conversations can be added
task.startConversation()

task.on('end',callback)
task.getResponsesByUser()
task.getResponsesBySubject()


Make bot say things by adding messages to a conversation
convo.say()
convo.ask()

handle user responses and alter the flow of the conversation
convo.sayFirst()
convo.next()
convo.repeat()
convo.silentRepeat()
convo.stop()

handle the conversation end and extract user responses
convo.on('end',callback)
convo.extractResponse()
convo.extractResponses()






```

bot.hears(['something'],'direct_message',function(message) {

  bot.startTask(message,function(task,conversation) {

    conversation.say('something');

    conversation.ask('question',function(answer) {

      conversation.say('something else...');

    });


    conversation.on('end',function(conversation) {

      // retrieve user responses to questions:
      // var user_responses = conversation.extractResponses();

      // get a full transcript of all the messages sent and received
      // var transcript = conversation.transcript;

      // get a list of all the messages sent
      // var sent = conversation.sent;

      // get the final status of this conversation
      // (completed, stopped, timeout)
      // var status = conversation.status;

    });

    task.on('end',function(task) {

      var user_responses = task.getResponsesByUser();



    });


  });
})
```
