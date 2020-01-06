# botbuilder-adapter-webex changelog

# 1.0.5

* Update to latest Webex API client library.
* Fix to mention stripping to better support Webex web client formatting
* Update dependencies (Bot Framework to 4.6, Botkit to 4.6)

# 1.0.3

* Add support for [Adaptive Cards](https://developer.webex.com/blog/new-buttons-cards-webex-teams) thanks to [@darrenparkinson](https://github.com/howdyai/botkit/pull/1760)
* Replace `ciscospark` package with `webex` package, thanks to [@teamup](https://github.com/howdyai/botkit/pull/1748)

Developers who wish to use this brand new feature should add the following lines to their bot.js file
in order to create a dedicated webhook for receiving card submissions from the Webex client. Note that this
is necessary due to a bug in the Webex webhook service, and will be removed from future versions.

```
controller.ready(async function() {
    await controller.adapter.registerAdaptiveCardWebhookSubscription('/api/messages');
});
```

Once enabled, your bot will receive `attachmentActions` events with `message.inputs` set to include values from the card.

# 1.0.2

* Update dependencies (Bot Framework to 4.5.2, Botkit to 4.5)
* Fix for file attachments

# 1.0.1

* 1:1 messages between bot and user will now emit `direct_message` events instead of `message` events
* Messages will now have `orgId`, `appId` and `actorId` fields
* Add `enable_incomplete` option to allow adapter to start without a complete config.

# 1.0.0 

First release
