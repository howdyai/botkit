# Upgrading Botkit 0.5 to 0.6

With the introduction of the [Botkit Message Pipeline](../readme-pipeline.md),
a few things changed about the way message events are
emitted that may impact developers who built their
bot using an earlier version of Botkit.

Though we've made fairly substantial under-the-hood changes to Botkit in this version,
most bots should continue to function without requiring any changes.
However, as a precaution, we urge developers to carefully test their bot with the new version of Botkit before going live.

## How to upgrade Botkit

Inside your Botkit application's root folder, run the command:

```
npm update --save botkit
```

This will cause your version of Botkit to be updated to the latest
available version (0.6.0), and your package.json file will be modified.

Alternately, you can edit your package.json file by hand, changing the
version option for Botkit to '^0.6'.

## Does my bot require any changes?

Facebook Bots that use the `receive_via_postback` option, and Slack bots that use the `interactive_replies` option may require small updates.

In the past, it was sometimes possible for Botkit to emit more than one event
per incoming message - in particular, when handling button click events
as typed user text. This double-event behavior was enabled by configuration
switches - one for Facebook, and one for Slack - which are now deprecated.

As of version 0.6, incoming messages will only ever emit a single event.
These button click events can will now have the button payload value included as the `message.text` property, and can thus be treated like other types of user messages.

## For Facebook Messenger Bots:

The `receive_via_postback` option is no longer needed to receive button clicks as typed messages in conversations. They will now be captured automatically.

In addition, developers can now include `facebook_postback` in the list
of events when specifying `hears()` patterns. This will allow button clicks
and other postback events to trigger heard patterns.

Developers who previously used `receive_via_postback` may want to add `facebook_postback` to their hears() handlers to ensure no functionality is lost.

```
controller.hears('welcome','facebook_postback', function(bot, message) {
    // respond when a user clicks a button with the payload value "welcome"
});
```

## For Slack Bots:

The `interactive_replies` is no longer needed to receive button clicks as typed messages in conversations. They will now be captured automatically.

In addition, developers can now include `interactive_message_callback` in the list of events when specifying `hears()` patterns. This will allow button clicks to trigger heard patterns.

Developers who previously used `interactive_replies` may want to add `interactive_message_callback` to their hears() handlers to ensure no functionality is lost.

```
controller.hears('welcome','interactive_message_callback', function(bot, message) {
    // respond when a user clicks a button with the value set to "welcome"
});
```

## Slack Starter Kit Fix

In previous versions of the Slack Starter Kit, we included a clever skill which allowed buttons to be treated as typed text if the `name` of the button was set to "say."  In addition to re-emitting the event as a type message, this skill also caused the message in Slack to be updated.

If you use this skill and want to upgrade to the latest version of Botkit, you should replace the `skills/interactive_messages.js` file in your project with [this updated version](https://github.com/howdyai/botkit-starter-slack/blob/master/skills/interactive_messages.js).

This new version now defines a `receive middleware` that looks for `interactive_message_callback` events and performs update to the message. It no longer needs to re-emit the message, as after the middleware completes, the message will pass naturally to any ongoing conversation or `hears` handler.
