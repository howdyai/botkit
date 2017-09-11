# Change Log

[View the official Botkit roadmap](https://github.com/howdyai/botkit/projects/7) for upcoming changes and features.

[Want to contribute? Read our guide!](https://github.com/howdyai/botkit/blob/master/CONTRIBUTING.md)

## 0.6.0

This version features some BIG CHANGES!

**New platform support:**

[Microsoft Teams](docs/readme-teams.md) is now officially supported with its own connector, including new features in [Botkit Studio](https://studio.botkit.ai) like authoring of Teams-specific attachments, an app package builder and configuration manager, and [a new starter kit](https://github.com/howdyai/botkit-starter-teams).

[Read the full docs for Botkit for Microsoft Teams](docs/readme-teams.md)

**Major changes to message handling code:**

[Introducing the Botkit Message Pipeline](docs/readme-pipeline.md), a formalized process for Botkit's handling of incoming and outgoing messages. All of the platform connectors have been refactored to use this new series of middleware functions, and are now implemented in a uniform way.

Developers who make use of Botkit's middleware system should [take time to read this update](docs/readme-pipeline.md). Most current middleware functions will  continue to work as expected, but mild changes may be desirable to update these functions to use Botkit's latest features.

In addition, developers who use third party middleware plugins should carefully retest their applications after upgrading to version 0.6, as these plugins may need to be updated for full compatibility.

**Upgrade Guide:**

This version of Botkit deprecates the `receive_via_postback` and `interactive_replies` options
that caused button clicks to be treated as typed messages.  These and other small changes to the way Botkit emits events may require minor updates to some Botkit apps.

[Upgrading from Botkit 0.5 or lower? Read this guide!](docs/howto/upgrade_05to06.md)


## 0.5.8

Slack: Support for sending ephemeral messages with `bot.whisper()` and `bot.sendEphemeral()`. In addition, any message with `message.ephemeral` set to true will be sent with `bot.sendEphemeral()` automatically. [Read documentation here.](docs/readme-slack.md#ephemeral-messages) Thanks to [@jonchurch](https://github.com/howdyai/botkit/pull/958)

Slack: Add support for `bot.api.files.sharedPublicURL()` method. Thanks to [@GitTristan](https://github.com/howdyai/botkit/pull/912)

Facebook: Support for using [message tags](https://developers.facebook.com/docs/messenger-platform/message-tags).  [Read documentation here.](docs/readme-facebook.md#message-tags) Thanks to [@ouadie-lahdioui](https://github.com/howdyai/botkit/pull/960)

Facebook: Support for using Facebook's new built-in NLP tools. [Read documentation here.](docs/readme-facebook.md#built-in-nlp) Thanks to [@ouadie-lahdioui](https://github.com/howdyai/botkit/pull/943) for this one too!!


Twilio SMS: Add support for sending MMS messages (file attachments) via Twilio. [Read documentation here.](docs/readme-twiliosms.md#sending-media-attachments-mms) Thanks to [@krismuniz](https://github.com/howdyai/botkit/pull/951)!

Cisco Spark: Emit a console warning when a bot receives messages from outside the allowed domain list. Thanks to [@MathRobin](https://github.com/howdyai/botkit/pull/918)!

New: Typescript declarations! Thanks to [@uny and @naktibalda](https://github.com/howdyai/botkit/pull/953) for their work on this.



## 0.5.7

Lock in ciscospark dependency at version 1.8.0 until further notice due to breaking changes in more recent versions.

## 0.5.6

Fix for Botkit Studio-powered bots: Facebook attachments can now be added without buttons

Fix for Cisco Spark: Bot mentions will now reliably be pruned from message, regardless of what client originated the message

Fix for Cisco Spark: startPrivateConversationWithPersonID has been fixed.

## 0.5.5

*Introducing Botkit for SMS!* Botkit bots can now send and receive messages using Twilio's Programmable SMS API!
Huge thanks to @krismuniz who spearheaded this effort! [Read all about Twilio SMS here](docs/readme-twiliosms.md)

*New unit tests* have been added, thanks to the ongoing efforts of @colestrode, @amplicity and others.
This release includes coverage of the Botkit core library and the Slack API library.
This is an [ongoing effort](https://github.com/howdyai/botkit/projects/3), and we encourage interested developers to get involved!

Add missing error callback to catch Slack condition where incoming messages do not match a team in the database.
[PR #887](https://github.com/howdyai/botkit/pull/887) thanks to @alecl!

Add support for Facebook attachment upload api [PR #899](https://github.com/howdyai/botkit/pull/899) thanks @ouadie-lahdioui!
Read docs about this feature [here](docs/readme-facebook.md#attachment-upload-api)

Fixed issue with Slack message menus. [PR #769](https://github.com/howdyai/botkit/pull/769)

Fixed confusing parameter in JSON storage system. `delete()` methods now expect object id as first parameter. [PR #854](https://github.com/howdyai/botkit/pull/854) thanks to @mehamasum!

All example bot scripts have been moved into the [examples/](examples/) folder. Thanks @colestrode!

Fixes an instance where Botkit was not automatically responding to incoming webhooks from Cisco with a 200 status. [PR #843](https://github.com/howdyai/botkit/pull/843)

Updated dependencies to latest: twilio, ciscospark, https-proxy-agent, promise

## 0.5.4

Fix for [#806](https://github.com/howdyai/botkit/issues/806) - new version of websocket didn't play nice with Slack's message servers

Support for Slack's new [rtm.connect method](https://api.slack.com/methods/rtm.connect).

Use rtm.connect instead of rtm.start when connecting an RTM bot to Slack. This should performance during connections.

## 0.5.3

Add a new [readme file](readme.md) and moved other documentation into `docs/` folder.

Update all dependencies to their most recent versions

Change behavior of conversation timeouts. [New behavior is documented here.](docs/readme.md#handling-conversation-timeouts)

Support for Facebook Messenger's new "Home URL" setting [PR #793](https://github.com/howdyai/botkit/pull/793)
[New features documented here.](https://github.com/howdyai/botkit/blob/master/docs/readme-facebook.md#controllerapimessenger_profilehome_url)

Support for including parameters in Facebook codes. [PR #790](https://github.com/howdyai/botkit/pull/790)
[Docs here.](https://github.com/howdyai/botkit/blob/master/docs/readme-facebook.md#messenger-code-api)

Support for Facebook's new "target audience" APIs [PR #798](https://github.com/howdyai/botkit/pull/798)

Support for additional Slack user APIs, including 'user.profile.set' and 'user.profile.get'. [PR #780](https://github.com/howdyai/botkit/pull/780)

Add support for `createPrivateConversation()` in Slack bots [PR #586](https://github.com/howdyai/botkit/pull/586)

*beforeThread Hooks:*

These new hooks allow developers to execute custom functionality as a conversation transitions from one thread to another.
This enables asynchronous operations like database and API calls to be made mid-conversation, and can be used to add additional
template variables (using `convo.setVar()`), or change the direction of the conversation (using `convo.gotoThread()`).

Add `convo.beforeThread()`, a plugin hook that fires before a conversation thread begins. [Docs](docs/readme.md#convobeforethread)

Add `controller.studio.beforeThread()`, a plugin hook that fires before a Botkit Studio-powered conversation thread begins. [Docs](docs/readme-studio.md#controllerstudiobeforethread)


## 0.5.2

*Changes for Slack:*

Add support for Slack's new `chat.unfurl` method for use with [App Unfurls](https://api.slack.com/docs/message-link-unfurling)

Add additional Slack's team API methods [PR #677](https://github.com/howdyai/botkit/pull/677)

Botkit will now store the value of the state parameter used in the oauth flow in the team's record [PR #657](https://github.com/howdyai/botkit/pull/657)

Fixes slash commands when using internal webserver [PR #699](https://github.com/howdyai/botkit/pull/699)

Add error logging for say and spawn.run [PR #691](https://github.com/howdyai/botkit/pull/691)

*Changes for Facebook Messenger:*

Updates to Facebook's Messenger Profile APIs (previously thread settings APIs) [PR #690](https://github.com/howdyai/botkit/pull/690)

Add ability to retrieve Messenger Code image [PR #689](https://github.com/howdyai/botkit/pull/689)

Add support for Facebook's domain whitelisting API [PR #573](https://github.com/howdyai/botkit/pull/573)

Add tests for handleWebhookPayload in Facebook bot flow [PR #678](https://github.com/howdyai/botkit/pull/678)

Add Facebook account linking support [PR #578](https://github.com/howdyai/botkit/pull/578)

Add ability to customize api url for Facebook [PR #576](https://github.com/howdyai/botkit/pull/567)

*Changes to Botkit Core:*

Add "done" and "exit" as a utterances for "quit" [PR #498](https://github.com/howdyai/botkit/pull/498)

*Thanks*

Thanks to @jhsu @davidwneary @mbensch @alecl @ouadie-lahdioui @agamrafaeli @katsgeorgeek @jfairley


## 0.5.1

Fixes for Cisco Spark:

Allow port number to be included in public_address

Fix to issue when using retrieveFile()

Fixes for Slack:

Add support for `channel.replies` API

Fixes for Facebook:

Add support for [Facebook account linking](https://github.com/howdyai/botkit/pull/645)

## 0.5.0

Add support for bots on [Cisco Spark](http://developer.ciscospark.com)! For information about getting started, and to learn about new Botkit features that are specific to this platform, [check out our new Cisco Spark readme. ](readme-ciscospark.md)

Botkit will now send a user agent header on all requests to the Slack API

When building for Slack, developers may now override the root URL of the API by specifying `api_root` in the configuration in order to use mocked testing endpoints or use the Slack API through a proxy.

## 0.4.10

Add support for [Slack Enterprise Grid](https://slack.com/enterprise), for more information [read](https://blog.howdy.ai/beam-us-up-botkit-in-the-enterprise-e6133e0cbdf3#.o3md9lw29)

Add Support for Slack's new thread system, including:

[bot.replyInThread()](readme-slack.md#botreplyinthread) to create a threaded reply

[bot.startConversationInThread()](readme-slack.md#botstartconversationinthread) to create and immediately start a conversation in a thread

[bot.createConversationInThread()](readme-slack.md#botcreateconversationinthread) to create a conversation in a thread

Add new `heard` middleware endpoint, which fires _after_ a pattern has been matched, but before the handler function is called. This allows developers to enrich messages with NLP tools or other plugins, but do so only when the original message matches specific criteria.

Add new `capture` middleware endpoint, which fires _after_ a user responds to a `convo.ask` question but _before_ the related handler function is called. This allows developers to change the value that is captured, or capture additional values such as entities returned by an NLP plugin.


## 0.4.9

`controller.version()` will now report the currently installed version of Botkit.

Change to how quick replies are rendered via Botkit Studio's API

## 0.4.7

Add support for Facebook Messenger "location" quick replies [PR #568](https://github.com/howdyai/botkit/pull/568)

Add support for Slack's new users.setPresence API [PR #562](https://github.com/howdyai/botkit/pull/562)

Add support for Slack's new reminders API [PR #580](https://github.com/howdyai/botkit/pull/580)



## 0.4.6

Change to controller.studio.runTrigger: Will now resolve promise regardless of whether a trigger was matched

## 0.4.5

Bug fix: Fix detection of Slackbot interactive callbacks

## 0.4.4

Changes:

Add referral field to `facebook_postback` events, if set [PR #552](https://github.com/howdyai/botkit/pull/553)

Refactor handling of incoming webhooks from Slack and Facebook in order to make it easier for developers to create custom endpoints and/or integrate Botkit into existing Express applications.

Add `controller.handleWebhookPayload()` to process a raw webhook payload and ingest it into Botkit

Make stale connection detection configurable [PR #505](https://github.com/howdyai/botkit/pull/505)

DDOS Vulnerability Fix - Secure Facebook Webhook [PR #555](https://github.com/howdyai/botkit/pull/555)


Bug fixes:

Fix an issue where a custom redirect_uri would be rejected by Slack's oauth verification

Fix bot_channel_join and bot_group_join with Slack Events API [PR #514](https://github.com/howdyai/botkit/pull/514)

Fix path to static content directory [PR #546](https://github.com/howdyai/botkit/pull/546)

`retry` and `send_via_rtm` options are now properly associated with the controller object.

Fix some issues pertaining to typing indicators and the slack RTM [PR #533](https://github.com/howdyai/botkit/pull/533)




## 0.4.3

Adds [convo.transitionTo()](readme.md#convotransitionto), a new feature for creating smoother transitions between conversation threads

Adds support for new Facebook Messenger [thread settings APIs](readme-facebook.md#thread-settings-api)
which enable developers to set and manage the 'getting started' screen and persistent menus.

Adds support for Facebook Messenger attachment in [Botkit Studio](https://studio.botkit.ai)

Adds a check to ensure messages are properly received by Facebook and Slack before proceeding to next message in a conversation.

Adds optional `require_delivery` option for Facebook and Slack bots which tells Botkit to wait to receive a delivery confirmation from the platform before sending further messages. [Slack info](readme-slack.md#require-delivery-confirmation-for-rtm-messages) [Facebook info](readme-facebook.md#require-delivery-confirmation)

Change: Receiving `facebook_postback` events as normal "spoken" messages now requires the `{receive_via_postback:true}` option be set on the controller. [Read more](readme-facebook.md#receive-postback-button-clicks-as-typed-messages)

## 0.4.2

Support for Slack's [Events API](https://api.slack.com/events-api) is here, thanks to the Botkit contributor community. [Read documentation here](https://github.com/howdyai/botkit/blob/master/readme-slack.md#events-api)

Bug fix:

Fixes an issue with setting the default IP address for the Express server introduced in 0.4.1

## 0.4.1

This release contains many small fixes and updates to keep up with the ever changing platforms!

BIG CHANGES:

Slack bots will now send messages via the Web API instead of the RTM. This behavior can be changed by passing `send_via_rtm: true` to `controller.spawn()`

Adds [ConsoleBot](lib/ConsoleBot.js) for creating bots that work on the command line

Adds a new [Middleware Readme](readme-middlewares.md) for documenting the existing middleware modules

Adds an example for using quick replies in the [Facebook Example Bot](examples/facebook_bot.js)

Adds additional fields to Facebook messages to specify if they are `facebook_postback`s or normal messages.

Adds optional `hostname` field to constructor functions to bind Express to a specific IP.

Fixes for Slack's files.upload API

Merge in numerous pull requests from the community:
[PR #461](https://github.com/howdyai/botkit/pull/461)
[PR #465](https://github.com/howdyai/botkit/pull/465)
[PR #466](https://github.com/howdyai/botkit/pull/466)
[PR #469](https://github.com/howdyai/botkit/pull/469)
[PR #472](https://github.com/howdyai/botkit/pull/472)
[PR #474](https://github.com/howdyai/botkit/pull/474)
[PR #434](https://github.com/howdyai/botkit/pull/434)
[PR #435](https://github.com/howdyai/botkit/pull/435)
[PR #440](https://github.com/howdyai/botkit/pull/440)
[PR #441](https://github.com/howdyai/botkit/pull/441)
[PR #443](https://github.com/howdyai/botkit/pull/443)
[PR #446](https://github.com/howdyai/botkit/pull/446)
[PR #448](https://github.com/howdyai/botkit/pull/448)


## 0.4

Add support for Botkit Studio APIs. [More Info](readme-studio.md)

Substantially expanded the documentation regarding Botkit's [conversation thread system](readme.md#conversation-threads).

Add support for Microsoft Bot Framework.  The [Microsoft Bot Framework](https://botframework.com) makes it easy to create a single bot that can run across a variety of messaging channels including [Skype](https://skype.com), [Group.me](https://groupme.com), [Facebook Messenger](https://messenger.com), [Slack](https://slack.com),
[Telegram](https://telegram.org/), [Kik](https://www.kik.com/), [SMS](https://www.twilio.com/), and [email](https://microsoft.office.com). [More Info](readme-botframework.md)

Updates to Facebook Messenger connector to support features like message echoes, read receipts, and quick replies.

Merged numerous pull requests from the community:
[PR #358](https://github.com/howdyai/botkit/pull/358)
[PR #361](https://github.com/howdyai/botkit/pull/361)
[PR #353](https://github.com/howdyai/botkit/pull/353)
[PR #363](https://github.com/howdyai/botkit/pull/363)
[PR #320](https://github.com/howdyai/botkit/pull/320)
[PR #319](https://github.com/howdyai/botkit/pull/319)
[PR #317](https://github.com/howdyai/botkit/pull/317)
[PR #299](https://github.com/howdyai/botkit/pull/299)
[PR #298](https://github.com/howdyai/botkit/pull/298)
[PR #293](https://github.com/howdyai/botkit/pull/293)
[PR #256](https://github.com/howdyai/botkit/pull/256)
[PR #403](https://github.com/howdyai/botkit/pull/403)
[PR #392](https://github.com/howdyai/botkit/pull/392)



In order to learn about and better serve our user community, Botkit now sends anonymous usage stats to stats.botkit.ai. To learn about opting out of stats collection, [read here](readme.md#opt-out-of-stats).

## 0.2.2

Add support for Slack Interactive Messages.

Add example of Slack button application that provides a bot that uses interactive messages.

New functionality in Slack bot: Botkit will track spawned Slack bots and route incoming webhooks to pre-existing RTM bots. This enables RTM bots to reply to interactive messages and slash commands.

## 0.2.1

Improves Slack RTM reconnects thanks to @selfcontained [PR #274](https://github.com/howdyai/botkit/pull/274)

## 0.2

Adds support for Twilio IP Messenging bots

Add example bot: twilio_ipm_bot.js

## 0.1.2

*Slack changes:*

Adds authentication of incoming Slack webhooks if token specified. [More info](readme_slack.md#securing-outgoing-webhooks-and-slash-commands) [Thanks to [@sgud](https://github.com/howdyai/botkit/pull/167)]

Improves support for direct_mentions of bots in Slack (Merged [PR #189](https://github.com/howdyai/botkit/pull/189))

Make the oauth identity available to the user of the OAuth endpoint via `req.identity` (Merged [PR #174](https://github.com/howdyai/botkit/pull/174))

Fix issue where single team apps had a hard time receiving slash command events without funky workaround. (closes [Issue #108](https://github.com/howdyai/botkit/issues/108))

Add [team_slashcommand.js](/examples/slack/team_slashcommand.js) and [team_outgoingwebhook.js](/examples/slack/team_outgoingwebhook.js) to the examples folder.



*Facebook changes:*

The `attachment` field may now be used by Facebook bots within a conversation for both convo.say and convo.ask.  In addition, postback messages can now be received as the answer to a convo.ask in addition to triggering their own facebook_postback event. [Thanks to [@crummy](https://github.com/howdyai/botkit/pull/220) and [@tkornblit](https://github.com/howdyai/botkit/pull/208)]

Include attachments field in incoming Facebook messages (Merged [PR #231](https://github.com/howdyai/botkit/pull/231))

Adds built-in support for opening a localtunnel.me tunnel to expose Facebook webhook endpoint while developing locally. (Merged [PR #234](https://github.com/howdyai/botkit/pull/234))

## 0.1.1

Fix issue with over-zealous try/catch in Slack_web_api.js

## 0.1.0

Adds support for Facebook Messenger bots.

Rename example bot: bot.js became slack_bot.js

Add example bot: facebook_bot.js

## 0.0.15

Changes conversation.ask to use the same pattern matching function as
is used in `hears()`

Adds `controller.changeEars()` Developers can now globally change the
way Botkit matches patterns.


## 0.0.14

Add new middleware hooks. Developers can now change affect a message
as it is received or sent, and can also change the way Botkit matches
patterns in the `hears()` handler.

## 0.0.~

Next time I promise to start a change log at v0.0.0
