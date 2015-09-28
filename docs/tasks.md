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


```

bot.hears(['something'],'direct_message',function(connection,message) {

  bot.startTask(connection,message,function(task,conversation) {

    conversation.say('something');

    conversation.ask('question',function(answer) {

    });


    conversation.on('end',function(conversation) {


    });

    task.on('end',function(task) {

      var user_responses = task.getResponsesByUser();



    });


  });
})
