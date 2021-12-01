# Change Log

[View the official Botkit roadmap](https://github.com/howdyai/botkit/projects/9) for upcoming changes and features.

[Want to contribute? Read our guide!](https://github.com/howdyai/botkit/blob/master/CONTRIBUTING.md)

# 4.15.0

* Update dependencies to Bot Framework 4.15
* Update various dev dependencies and external libraries
* CHANGE: Correct `from` field to be user rather than bot with Slack button clicks. Thanks to [@mdrichardson](https://github.com/mdrichardson) for the [pull request](https://github.com/howdyai/botkit/pull/2089).

# 4.10.0

* Update dependencies to [Bot Framework 4.10.1](https://github.com/microsoft/botbuilder-js/releases/tag/4.10)
* Update some dev dependencies like lerna, eslint, etc.

* NEW: Additional support for Microsoft Teams! [Read all about it](packages/docs/core.md#ms-teams-extensions) or [see these new methods in action](packages/testbot/features/teams_features.js)
  * Bot workers spawned from the default adapter now feature `bot.teams` which is an instance to the [TeamsInfo helper class](https://docs.microsoft.com/en-us/javascript/api/botbuilder/teamsinfo?view=botbuilder-ts-latest). 
  * Botkit now includes an optional middleware [TeamsInvokeMiddleware](packages/docs/reference/core.md#TeamsInvokeMiddleware) for handling "invoke" responses from Teams including task modules.
  * Botkit now includes [bot.replyWithTaskInfo()](packages/docs/reference/core.md#replyWithTaskInfo) which can be used to respond to task module events. [Read more about Task Modules](https://docs.microsoft.com/en-us/microsoftteams/platform/task-modules-and-cards/what-are-task-modules)

* FIX: Adjust mechanism for handling templates in channelData to avoid data loss. Thanks [@ashitikov](https://github.com/ashitikov) for the [pull request](https://github.com/howdyai/botkit/pull/1979)
* FIX: Botkit will now spawn the appropriate botworker if a custom adapter is passed in. Thanks to [@etiennellipse](https://github.com/etiennellipse) for [reporting this issue](https://github.com/howdyai/botkit/issues/1984)!

# 4.9.0

* Update dependencies to [Bot Framework 4.9](https://github.com/microsoft/botbuilder-js/releases/tag/4.9.0)
* Update some dev dependencies like lerna, mocha and nyc

* FIX: Allow size limits to be adjusted on the Express json and urlencoded parsers. Fixes [#1941](https://github.com/howdyai/botkit/issues/1941)
* FIX: Allow bots to be spawned with null config. Thanks to [@NxP4Code](https://github.com/NxP4Code) for [this pull request](https://github.com/howdyai/botkit/pull/1955)
* FIX: Fix dynamic text field type definition. Thanks to [@etienneellipse](https://github.com/etiennellipse) for [this pull request](https://github.com/howdyai/botkit/pull/1960)

# 4.8.1

* FIX: Fixing a bug introduced in 4.8 pertaining to spawning proactive bots for Slack. [#1937](https://github.com/howdyai/botkit/issues/1937)


# 4.8

In addition to fixing a bunch of bugs and adding some new features, this version brings Botkit up to date with Bot Framework's latest release - [Change log here](https://github.com/microsoft/botbuilder-js/releases). 

There are lots of interesting things happening in the Bot Framework world including a new [GUI for dialog management called Bot Framework Composer](https://github.com/microsoft/botframework-composer), a new templating system called [Language Generation](https://github.com/microsoft/BotBuilder-Samples/tree/master/experimental/language-generation), and more. Check out the [main hub repo for more information.](https://github.com/microsoft/botframework-sdk#readme)

### NEW 

* NEW: At long last, the convo.ask callbacks can receive the full incoming message payload in addition to the text content.
This allows developers to use payload values inside quick replies, button clicks and other rich operations. Many thanks to [@naikus](https://github.com/naikus) for the effort and patience it took to get this in! [PR #1801](https://github.com/howdyai/botkit/pull/1801)
* NEW: Multi-adapter support improved. Botkit will now spawn the appropriate type of Botworker when used in a multi-adapter scenario. [See this example for a demonstration of using multiple adapters in a single bot app](./packages/testbot/multiadapter.js). [Issue #1920](https://github.com/howdyai/botkit/issues/1920)
* NEW: Add support for Slack's v2 oauth. [More details here](./packages/botbuilder-adapter-slack/CHANGELOG.md#109). Thanks to [@sfny](https://github.com/sfny) for [PR #1928](https://github.com/howdyai/botkit/pull/1928)
* NEW: Values in `channelData` will now be processed as Mustache templates inside BotkitConversations. [Thanks @me-cedric](https://github.com/me-cedric) for [pr #1925](https://github.com/howdyai/botkit/pull/1925)
* NEW: New Dialog related features for determining if a bot is already in a conversation, including [bot.hasActiveDialog()](packages/docs/reference/core.md#hasActiveDialog),
[bot.getActiveDialog()](packages/docs/reference/core.md#getActiveDialog), and
[bot.isDialogActive()](packages/docs/reference/core.md#isDialogActive) 

### FIXED

* FIX: Facebook Adapter will not attempt to set up web routes if webserver is not configured. [#1916](https://github.com/howdyai/botkit/issues/1916)
* FIX: Exclude `activity.conversation.properties` field when generating state storage key. [#1849](https://github.com/howdyai/botkit/issues/1849)
* FIX: Allow startConversationWithUser to work with Bot Framework Emulator. [#1834](https://github.com/howdyai/botkit/issues/1834)
* FIX: Using `beginDialog` inside an `ask()` caused weird behaviors.  Fixes for [#1878](https://github.com/howdyai/botkit/issues/1878) and [#1932](https://github.com/howdyai/botkit/issues/1932)
* FIX: Webex - remove empty `files` key [#1906](https://github.com/howdyai/botkit/pull/1906)
* FIX: Slack - authed_users added to message [#1911](https://github.com/howdyai/botkit/issues/1911)
* Update: all dependencies to latest, including bot framework 4.7->4.8 and mustache 3.0 -> 4.0

# 4.6.1

Version 4.6.1 includes some security and bugfix updates along with bumping many dependencies to the latest versions.
We recommend updating both Botkit core and your platform adapter to the latest version.

* Update Bot Framework dependencies to 4.7.1.  Resolved [#1882](https://github.com/howdyai/botkit/issues/1882) and [#1894](https://github.com/howdyai/botkit/issues/1894).
* Remove `hbs` depencency from Botkit. Not used! Thanks @naktibaldi [#1855](https://github.com/howdyai/botkit/pull/1855)
* Botkit feature modules can now be written in ES6 syntax. Thanks @cooperka!! [#1854](https://github.com/howdyai/botkit/pull/1854)
* Allow `attachmentLayout` field in Botkit Conversations -- thanks @innorag [#1865](https://github.com/howdyai/botkit/pull/1865)
* Update dependencies and some minor eslint syntax fixes across all the adapters and sub-packages.
* Fixes in [botbuilder-adapter-slack](packages/botbuilder-adapter-slack/CHANGELOG.md#108)
* Fixes in [botbuilder-adapter-web](packages/botbuilder-adapter-web/CHANGELOG.md#106)


# 4.6

Version 4.6 includes security and bugfix updates to many dependencies, as well as fixes to some issues in Botkit core.
We recommend updating both Botkit core and your platform adapter to the latest version.

**New Features**
* Add a new `BotkitTestClient` class that makes it possible to write unit tests for dialogs. See [EXAMPLE UNIT TESTS HERE](https://github.com/howdyai/botkit/blob/master/packages/botkit/tests/Dialog.tests.js) -- [HUGE HUGE thanks to @qwertyuu for leading the effort on this!](https://github.com/howdyai/botkit/pull/1815)
* Support .ts (or parameterized) file extensions for loadModules [Thanks to @mutmatt for the PR](https://github.com/howdyai/botkit/pull/1777)
* The `text` field in a BotkitConversations can now be a function, which can be used to generated internationalized strings. [Thanks to @cooperka for the PR](https://github.com/howdyai/botkit/pull/1747)
* Add `convo.stop()` to allow conversation to be ended inside a handler.
* Update yeoman generator to make all environment variables UPPERCASE

**Fixes**
* Fix usePlugin parameter type declaration [thanks to @etiennellipse](https://github.com/howdyai/botkit/pull/1836)
* Fix ask/addQuestion type signatures [thanks to @etiennellipse](https://github.com/howdyai/botkit/pull/1818)
* Fix to how messages are constructed inside BotkitConversations. [thanks to @adantoscano](https://github.com/howdyai/botkit/pull/1746)
* Fail with better error when thread not found [Thanks to @cooperka](https://github.com/howdyai/botkit/pull/1758)
* correct mustache rendering from causing mutation of initial dialog script [Thanks to @InnoraG](https://github.com/howdyai/botkit/pull/1761)
* Fix: allow BotkitPlugins to have additional fields [Thanks to @roeintense](https://github.com/howdyai/botkit/issues/1804)
* Fix: resolve issues where calling cancelAllDialogs() would crash [thanks to @etiennellipse](https://github.com/howdyai/botkit/issues/1808)
* Fix: resolve issue where calling cancelAllDialogs() could cause repeat [thanks to @chahat-arora](https://github.com/howdyai/botkit/issues/1830)
* Fix: resolve issue where calling convo.repeat() would cause errors [thanks to akshaykonjier](https://github.com/howdyai/botkit/issues/1673) and [also to @etiennellipse](https://github.com/howdyai/botkit/issues/1811)

This update includes the following packages:

* Botkit v4.6.0
* generator-botkit v4.6.0
* [botbuilder-adapter-web v1.0.5](packages/botbuilder-adapter-web/CHANGELOG.md#105)
* [botbuilder-adapter-slack v1.0.6](packages/botbuilder-adapter-slack/CHANGELOG.md#106)
* [botbuilder-adapter-webex v1.0.4](packages/botbuilder-adapter-webex/CHANGELOG.md#104)
* [botbuilder-adapter-facebook v1.0.6](packages/botbuilder-adapter-facebook/CHANGELOG.md#106)
* [botbuilder-adapter-hangouts v1.0.4](packages/botbuilder-adapter-hangouts/CHANGELOG.md#103)
* [botbuilder-adapter-twilio-sms v1.0.4](packages/botbuilder-adapter-twilio-sms/CHANGELOG.md#104)
* [botkit-plugin-cms v1.0.3](packages/botkit-plugin-cms/CHANGELOG.md#103)

# 0.7.5

A maintenance release to the legacy branch was released as 0.7.5.

* Update out of date dependencies to address security issues
* Add support for Slack's new modals

# 4.5

We're skipping a few version numbers here to keep in sync with the rest of [Microsoft Bot Framework](https://github.com/microsoft/botframework).
Welcome to Botkit 4.5!  This release contains a host of improvements and bug fixes affecting Botkit's conversation system, as well the behavior
of some of the platform adapters.  We recommend that all developers currently using Botkit v4 upgrade to 4.5. 

Specific Changes: 

* NEW: It is now possible to create dynamic quick replies, and attachments within a BotkitConversation. [See full docs](https://botkit.ai/docs/v4/conversations.html#dynamic-quick-replies-and-attachments).
* NEW: Previously, there was no way to bind middleware to the internally created Express webserver. It is now possible to do so using the `webserver_middlewares` parameter.  [Full docs](https://botkit.ai/docs/v4/reference/slack.html#interface-slackadapteroptions)
* NEW: Quick replies and suggestedActions are now procssed as mustache templates. Thanks to [@InnoraG](https://github.com/innorag) for [the pull request](https://github.com/howdyai/botkit/pull/1731).
* NEW: Slack block actions and other button clicks now are message type events and get included in dialogs. Thanks to [@apemberton](https://github.com/apemberton) for the [pull request](https://github.com/howdyai/botkit/pull/1712).
* NEW: The key name passed in to convo.ask and convo.addQuestion can now be set to null in order to discard the answer. Thanks to [@adantoscano](https://github.com/adantoscano) for [the pull request](https://github.com/howdyai/botkit/pull/1716)


* FIX: Botkit will no longer improperly prune platform specific fields like quick replies and attachments specified inside BotkitConversations. [Fix for #1664](https://github.com/howdyai/botkit/issues/1664), [#1679](https://github.com/howdyai/botkit/issues/1679), and [#1699](https://github.com/howdyai/botkit/issues/1699).
* FIX: The text field in BotkitConversations was expected to always be an array, causing some confusion. It is now possible to pass in a string OR an array. Passing an array will cause Botkit to choose a random entry in the array for the message text.
* FIX: Several updates have been made to the middleware pipeline so that it better matches expected behavior.  The receive and send middlewares will now fire for every incoming message - previously, there were cases where these would not fire. Thanks to [@adantoscano](https://github.com/adantoscano) for [this pull request](https://github.com/howdyai/botkit/pull/1717) and also [this one](https://github.com/howdyai/botkit/pull/1720). 
* FIX: The method for passing in a URI for communicating with Botkit CMS has been made more reliable, thanks to [@adantoscano](https://github.com/adantoscano). [See #1675](https://github.com/howdyai/botkit/pull/1675) and [#1677](https://github.com/howdyai/botkit/pull/1677).
* FIX: Webex adapter has been updated to better support file uploads. Thanks to [@Teamop](https://github.com/Teamop) for [the pull request](https://github.com/howdyai/botkit/pull/1667)
* FIX: Improve mapping of Bot Framework "Activity" fields. Thanks to [@Naktibalda](https://github.com/Naktibalda) for [the pull request](https://github.com/howdyai/botkit/pull/1707).
* FIX: Expand typedefs for Slack dialogs. Thanks to [@roger-king](https://github.com/roger-king) for [the pull request](https://github.com/howdyai/botkit/pull/1653)


* UPDATE: Update to v4.5.2 of all Bot Framework packages
* UPDATE: `ws` websocket module updated to v7.1.1

This update includes the following packages:

* Botkit v4.5.0
* generator-botkit v4.5.0
* [botbuilder-adapter-web v1.0.4](packages/botbuilder-adapter-web/CHANGELOG.md#104)
* [botbuilder-adapter-slack v1.0.4](packages/botbuilder-adapter-slack/CHANGELOG.md#104)
* [botbuilder-adapter-webex v1.0.2](packages/botbuilder-adapter-webex/CHANGELOG.md#102)
* [botbuilder-adapter-facebook v1.0.4](packages/botbuilder-adapter-facebook/CHANGELOG.md#104)
* [botbuilder-adapter-hangouts v1.0.3](packages/botbuilder-adapter-hangouts/CHANGELOG.md#103)
* [botbuilder-adapter-twilio-sms v1.0.2](packages/botbuilder-adapter-twilio-sms/CHANGELOG.md#102)
* [botkit-plugin-cms v1.0.2](packages/botkit-plugin-cms/CHANGELOG.md#102)

----

# 4.0.2

* Added `disable_console` option to controller. When set to true, Botkit will not emit normal console output.
* Fix Typerscript signature of controller.spawn() - Thanks to [@naktibalda](https://github.com/Naktibalda) for [the fix](https://github.com/howdyai/botkit/pull/1648)
* Fix for allowing typing messages in dialogs - [Details](https://github.com/howdyai/botkit/issues/1646)
* Remove useless try/catch blocks -  - Thanks to [@naktibalda](https://github.com/Naktibalda) for [the fix](https://github.com/howdyai/botkit/pull/1654)
* Fix an issue where the convo.before hook would not fire as expected when looping a thread. 

Coinciding with 4.0.2, the adapters and plugin have also been updated with bug fixes and minor updates:

* [botbuilder-adapter-web v1.0.3](packages/botbuilder-adapter-web/CHANGELOG.md#103)
* [botbuilder-adapter-slack v1.0.3](packages/botbuilder-adapter-slack/CHANGELOG.md#103)
* [botbuilder-adapter-webex v1.0.1](packages/botbuilder-adapter-webex/CHANGELOG.md#101)
* [botbuilder-adapter-facebook v1.0.3](packages/botbuilder-adapter-facebook/CHANGELOG.md#103)
* [botbuilder-adapter-hangouts v1.0.2](packages/botbuilder-adapter-hangouts/CHANGELOG.md#102)
* [botbuilder-adapter-twilio-sms v1.0.1](packages/botbuilder-adapter-twilio-sms/CHANGELOG.md#101)
* [botkit-plugin-cms v1.0.1](packages/botkit-plugin-cms/CHANGELOG.md#101)

# Sub-package release notes

* [botbuilder-adapter-web v1.0.2](packages/botbuilder-adapter-web/CHANGELOG.md#102)
* [botbuilder-adapter-slack v1.0.2](packages/botbuilder-adapter-slack/CHANGELOG.md#102)

# 4.0.1

This is the first major release of the new version of Botkit!

* The same `hears()`, `says()` and `ask()` syntax you know and love, but now with modern Javascript conventions like async/await.
* New capabilities like [interruptions](https://botkit.ai/docs/v4/core.html#interruptions) and [composable dialogs](https://botkit.ai/docs/v4/conversations.html#composing-dialogs).
* All new platform adapters for Web chat, Slack, Webex, Facebook, Google Hangouts and Twilio SMS.
* Built-in support for [Microsoft Bot Framework](https://dev.botframework.com) features like:
    * Support for the [Bot Framework Emulator](http://aka.ms/botframework-emulator)
    * Support for [Dialogs](https://npmjs.com/package/botbuilder-dialogs)
    * Support for [Azure Bot Service](https://azure.microsoft.com/en-us/services/bot-service/)
* Long awaited fixes and improvements like:
    * Multi-page support for Facebook
    * Conversation state persistence between across app nodes / app restarts
    * Full Typescript support

The [all new docs for Botkit 4 can be found here](https://botkit.ai/docs/v4).
All of the [Glitch starter kits have been updated with the latest version](https://glitch.com/botkit).

The best way to get started with 4.0 is to boot up a brand new bot using the [Yeoman generator](https://npmjs.com/package/generator-botkit), and connect it to the [Bot Framework Emulator](http://aka.ms/botframework-emulator).
You'll be chatting with your new bot in minutes!

```javascript
npm install -g yo botkit
yo botkit
```

# 0.7.4

* only require simple_storage when used: [#1566](https://github.com/howdyai/botkit/pull/1566)
* Slack: [Extend support of blocks](https://github.com/howdyai/botkit/pull/1597) - Thanks to [@ihorrusinko](https://github.com/ihorrusinko)
* Slack: [Add new block_actions events](https://github.com/howdyai/botkit/pull/1596) - Thanks to [@makstaks](https://github.com/makstaks)
* [Updated docs for using blocks with Slack](https://botkit.ai/docs/readme-slack.html#interactive-messages) - Thanks to [@makstaks](https://github.com/makstaks)

# 0.7.3

* Slack: Messages can now contain a `blocks` field to support Slack's new [Block Kit feature](https://api.slack.com/reference/messaging/blocks). Thanks to [@ihorrusinko for this update](https://github.com/howdyai/botkit/pull/1594).
* Slack: [set useQuerystring to true in Slack API](https://github.com/howdyai/botkit/pull/1547)
* Slack: [Change 500 webserver status to 404 when team not found](https://github.com/howdyai/botkit/pull/1548)
* Google Hangouts: [allow to consume auth data from env var instead of file](https://github.com/howdyai/botkit/pull/1543)
* Pull requests will now trigger Travis builds


# 0.7.2

Update dependency on `request` to latest to fix security warnings in dependency tree.

# 0.7.1

Update dependency on `botbuilder` to `3.16` to fix security warnings in dependency tree.

# 0.7.0

This release is the first major step towards [deprecating Botkit Studio](https://github.com/howdyai/botkit/issues/1534),
and introducing a more general system for scripted dialogs and content from [Botkit CMS](https://github.com/howdyai/botkit-cms).

We urge all Botkit users to update to the most recent version of Botkit. This may require an update to your project's package.json file.

* Remove all functionality pertaining to Botkit Studio statistics and analytics APIs. All stats related services provided by Botkit Studio will cease operation on Dec 15.
* Remove `stats_optout` flag from configuration.
* Remove Botkit Studio options from command line interface.
* Calls to Botkit Studio and/or Botkit CMS will no longer include the user's id

New features and changes:

* Support for Facebook Personas API. [Full docs here](https://botkit.ai/docs/readme-facebook.html#personas-api) -- [Thanks to @ouadie-lahdioui](https://github.com/howdyai/botkit/pull/1497)!
* Many Facebook APIs [have been promisified](https://github.com/howdyai/botkit/pull/1520) by @htaidirt
* Improved technique used to verify incoming webhooks from Slack [use hmac compare instead of direct compare](https://github.com/howdyai/botkit/pull/1539) - Thanks, @danhofer!
# 0.6.21

* Add support for Slack's chat.getPermalink

# 0.6.20

* Fix bug introduced in 0.6.19 that caused events to improperly fire twice.
* Emit a warning if Slack webhook validation is not enabled.
* To prepare for upcoming changes to Botkit Studio and Botkit stats collection:
    * Prevent bots without Botkit Studio credentials from sending stat events
    * Emit a message about stats data collection at startup

# 0.6.19

No new features, but updates throughout the dependency tree for security and stability purposes.

* Updated dependency versions to latest available

* Rewrote Botkit command line tool to remove dependency on abandoned library. Upgrade to the latest: `npm install -g botkit`

* Switched from using jscs to eslint for linting purposes.

# 0.6.18

* Fix syntax error in Web connector. Oops! Thanks for reporting this issue @iworkforthem!

* Add support for Google Hangouts "card_clicked" event. [Thanks to @ouadie-lahdioui](https://github.com/howdyai/botkit/pull/1487)

# 0.6.17

In addition to minor fixes, dependency version updates, and documentation updates, this version includes:

* Google Hangouts support is here! Thanks to [@ouadie-lahdioui's hard work](https://github.com/howdyai/botkit/pull/1414), your bot can now operate in [Hangouts Chat](https://gsuite.google.com/products/chat/).

    Get started with the [Botkit Starter Kit for Google Hangouts](https://github.com/howdyai/botkit-starter-googlehangouts).

    [Botkit docs for Google Hangouts connector](https://botkit.ai/docs/readme-google-hangouts.html)

* CiscoSpark bots are now officially WebexBots. Everything is backwards compatible thanks to the hard work of [@ObjectIsAdvantag](https://github.com/howdyai/botkit/pull/1349), but you should move to using `Botkit.webexbot()` instead of `Botkit.sparkbot()` ASAP.

    [Botkit docs for Cisco Webex Teams](https://botkit.ai/docs/readme-webex.html)

    [Read more about these changes](https://botkit.ai/docs/readme-webex.html#webex-rebrand).

* Tests have been reorganized and updated thanks to [@fastbean-au](https://github.com/howdyai/botkit/pull/1468).

* Errors that occur in the middleware pipeline will now cause `pipeline_error` event to be emitted. In addition, errors at specific stages of the pipeline will also emit their own events: `ingest_error`, `normalize_error`, `categorize_error` and `receive_error`. This should make it easier to debug problems in middleware. Thanks to [@Nop0x](https://github.com/howdyai/botkit/pull/1425).  [Docs](https://botkit.ai/docs/core.html#middleware-error-events)

    Handle a pipeline error:
    ```javascript
    controller.on('pipeline_error', function(err, bot, message, stage_name) {
        // ... handle it!
    });
    ```

    Handle a specific stage error:
    ```javascript
    controller.on('ingest_error', function(err, bot, message) {
        // ... handle it!
    });
    ```


# 0.6.16

* Fixed issue in Cisco adapter introduced in 0.6.15

# 0.6.15

* [The documentation has moved to a dedicated docs site!](https://botkit.ai/docs) The transition begun 3 versions ago is now complete. [Any future changes to documentation should be submitted to this repo](https://github.com/howdyai/botkit-docs).

Some minor tweaks:

* Update to the way Webex Teams bots identify themselves [PR #1397](https://github.com/howdyai/botkit/pull/1397) Thank you to @jpjpjp

* Externalize the utterances object [#1085](https://github.com/howdyai/botkit/pull/1085) thanks to @hannanabdul55

* For Botkit web adapter, add `typingDelayFactor` config option, as well as `controller.setTypingDelayFactor()` to change how fast the bot types. Values between 0-1 will speed up the bot's typing, values above 1 will slow it down. - [Docs](https://botkit.ai/docs/readme-web.html#controllersettypingdelayfactordelayfactor) - [PR #1387](https://github.com/howdyai/botkit/pull/1387) Thanks to @schmitzl

Several updates to the TypeScript definitions:

* Add `collectResponse` to CoreBot's public types [#1358](https://github.com/howdyai/botkit/pull/1358) thanks to @pducks32
* Add missing methods to d.ts [#1359](https://github.com/howdyai/botkit/pull/1359) thanks to @ypresto
* Updating typings for interactive messages [#1318](https://github.com/howdyai/botkit/pull/1318) thanks to @jaalger

Thanks to frequent contributor @ouadie-lahdioui for the updates to Facebook Messenger:

* Add FB scheduled broadcast - [Docs](https://botkit.ai/docs/readme-facebook.html#cancel-a-scheduled-broadcast) - [#1354](https://github.com/howdyai/botkit/pull/1354)
* Add FB payment settings API - [Docs](https://botkit.ai/docs/readme-facebook.html#controllerapimessenger_profilepayment_settings) - [#1369](https://github.com/howdyai/botkit/pull/1369)
* Add FB Thread owner API - [Docs](https://botkit.ai/docs/readme-facebook.html#get-thread-owner) - [#1353](https://github.com/howdyai/botkit/pull/1353)

Support for Slack's new security feature:

* Request Signing with Slack Signing Secret - [Docs](https://botkit.ai/docs/readme-slack.html#securing-outgoing-webhooks-and-slash-commands) - [#1406](https://github.com/howdyai/botkit/pull/1406) thanks to @shishirsharma


# 0.6.14

* Fix for require_delivery option in Facebook bots. [PR #1312](https://github.com/howdyai/botkit/pull/1312)

* Errors encountered during Slack RTM connection process will now be reported to the callback function [PR #1335](https://github.com/howdyai/botkit/pull/1335)

* Updated methodology used to validate email addresses when restricting access to Cisco Spark bots

* Updated dependencies to latest stable versions



# 0.6.13

* Fix bugs and refactor handling of message actions, particularly as they relate to Botkit Studio scripts

* Adjust mechanism used to construct facebook quick reply payload in order to support future formats. [PR #1301](https://github.com/howdyai/botkit/pull/1301)

* Promisify Facebook Messenger profile API. [PR #1300](https://github.com/howdyai/botkit/pull/1300)

* Lower the log priority from 'log' to 'debug' for several messages in Botkit Core and Botkit Slack.


# 0.6.12

* [Botkit has a brand new docs site!](https://botkit.ai/docs) We have begun transitioning the documentation out of this repo into a [dedicated documentation repo](https://github.com/howdyai/botkit-docs).

* Remove dependency on Python introduced in 0.6.10.  Thanks to @qiongfangzhang for the attention on that!

* Fix for Facebook Messenger send broadcast function. [PR #1280](https://github.com/howdyai/botkit/pull/1280) Thanks @OmranAbazid

* Extend Facebook's user profile object with locale. [PR #1265](https://github.com/howdyai/botkit/pull/1265) Thanks @julianusti

* Added 'picture' to Facebook User Profile endpoint. [PR #1264](https://github.com/howdyai/botkit/pull/1264) Thanks @se

* Add FB request thread control [PR #1257](https://github.com/howdyai/botkit/pull/1257) Thanks as always to @ouadie-lahdioui

* Remove requirement that Cisco Spark endpoint be SSL. [PR #1284](https://github.com/howdyai/botkit/pull/1284) thanks @akalsey and your beard.

* Add support for Slack's `users.lookupByEmail` API. [PR #1285](https://github.com/howdyai/botkit/pull/1285)
Thanks to @piglovesyou

* Fix to the way variables are copied between conversations while using Botkit Studio scripts

# 0.6.11

* For Botkit Studio users, added `controller.studio.getById()` for loading scripts
by their unique ID rather than by name or trigger. [Docs here](docs/readme-studio.md#controllerstudiogetbyid)

# 0.6.10

* Add support for Cisco Jabber. Thanks to @qiongfangzhang and @panx981389 and their team at Cisco for the contribution!

[Documentation for the Cisco Jabber adapter can be found here](docs/readme-ciscojabber.md)

* Updated `ciscospark` dependency to latest version and fixed some bugs in the example bot

* Update Twilio dependency to latest, along with small updates to adapter. Thanks @nishant-chaturvedi! [PR #1140](https://github.com/howdyai/botkit/pull/1140)

# 0.6.9

* Add 2 new middleware endpoints that occur during conversations - `conversationStart(bot, convo, next)` and `conversationEnd(bot, convo, next)`.  [Some new documentation](docs/readme.md#conversation-events-and-middleware-endpoints)
* Conversations powered by Botkit Studio will now include `convo.context.script_name` and `convo.context.script_id` which point back to the script loaded from the Botkit Studio API
* When using Botkit Studio's execute script action, the resulting conversation object will have 2 additional context fields: `convo.context.transition_from` and `convo.context.transition_from_id` which will point to the script from which the user transitioned
* When using Botkit Studio's execute script action, the original conversation from which the user is transitioning will have 2 additional context fields: `convo.context.transition_to` and `convo.context.transition_to_id` which will point to the script to which the user transitioned
* Fix for Botkit Studio scripts which used "end and mark successful" action from a condition. Previously this would end, but not mark successful.

Merged Pull Requests:
* Make sure Facebook API errors are passed to callback if specified [PR #1225](https://github.com/howdyai/botkit/pull/1225)
* Refresh Microsoft Teams token when it has expired. [PR #1230](https://github.com/howdyai/botkit/pull/1230)
* Update TypeScript definition for Web bots [PR #1231](https://github.com/howdyai/botkit/pull/1231)
* Update TypeScript definition for bot.replyAndUpdate [PR #1232](https://github.com/howdyai/botkit/pull/1232)
* Fix for Microsoft teams button builder function [PR #1233](https://github.com/howdyai/botkit/pull/1233)

# 0.6.8

BIG UPDATE:

[Botkit now works on the web!](docs/readme-web.md) The new web connector supports websocket and webhook connections for sending and receiving messages. The brand new [Botkit Anywhere starter kit](https://github.com/howdyai/botkit-starter-web) includes a [customizable web chat client](https://github.com/howdyai/botkit-starter-web/blob/master/docs/botkit_web_client.md), and a [built-in chat server](https://github.com/howdyai/botkit-starter-web/blob/master/docs/botkit_chat_server.md).  Of course, this works with the existing stack of Botkit tools and plugins!

New for Botkit Studio:

Developers using Botkit Studio to create and manage script content can now utilize a new message action in their conditional statements, or at the end of any thread.
It is now possible to direct your bot to seamlessly transition to a different Botkit Studio script. This allows for new patterns like interconnected menus, loops and branching conversations.

New core features:

Developers can now exclude specific types of events from being included in conversations using `controller.excludeFromConversations(event_name)`.
This has been applied to the Facebook connector, which will now exclude certain events automatically. [Docs](docs/readme.md#excluding-events-from-conversations)

The tick interval used for driving conversations can now be adjusted using `controller.setTickDelay(ms)`.  [Docs](docs/readme.md#changing-the-speed-of-botkits-internal-tick)


Merged pull requests:

Our community of Botkit Core developers is more than 150 people strong! Thank you to all of the contributors who spent their precious time improving Botkit for everyone. There are more than a dozen pull requests included in this release!!

Core:

* Upgraded the `ws` dependency to latest - [Thanks @naktibalda](https://github.com/howdyai/botkit/pull/1154)
* Add delete method to in-memory store - [Thanks @naktibalda](https://github.com/howdyai/botkit/pull/1164)
* memory store: don't log warning after each save - [Thanks @naktibalda](https://github.com/howdyai/botkit/pull/1197)

Facebook:

This release contains a ton of updates to the Facebook connector, many of which were contributed by @ouadie-lahdioui!

* pass error object to the callbacks for failed send Api calls - [Thanks @nishant-chaturvedi](https://github.com/howdyai/botkit/pull/1147)
* Secures FB Graph API Requests with optional app secret [Docs](docs/readme-facebook.md#app-secret-proof) - [Thanks @ouadie-lahdioui](https://github.com/howdyai/botkit/pull/1170)
* Add Facebook Handover Protocol [Docs](docs/readme-facebook.md#handover-protocol) - [Thanks @ouadie-lahdioui](https://github.com/howdyai/botkit/pull/978)
* Include messaging_type property in all Botkit message sends [Docs](docs/readme-facebook.md#messaging-type)- [Thanks @ouadie-lahdioui](https://github.com/howdyai/botkit/pull/1171)
* Add FB Broadcast Messages API [Docs](https://github.com/howdyai/botkit/blob/068/docs/readme-facebook.md#broadcast-messages-api) - [Thanks @ouadie-lahdioui](https://github.com/howdyai/botkit/pull/1180)
* Add Facebook insights API [Docs](https://github.com/howdyai/botkit/blob/068/docs/readme-facebook.md#messaging-insights-api) - [Thanks @ouadie-lahdioui](https://github.com/howdyai/botkit/pull/1183)
* Include user's email in profile if returned from facebook API - [Thanks @iniq](https://github.com/howdyai/botkit/pull/1193)
* Properly trigger security session events from facebook workplace - [Thanks @ariel-learningpool](https://github.com/howdyai/botkit/pull/1110)
* fix bug when using Facebook Checkbox Plugin - [Thanks @shmuelgutman](https://github.com/howdyai/botkit/pull/1101)

Botkit will now exclude `message_delivered`, `message_echo` and `message_read` events from inclusion in conversations using the new `excludeFromConversations()` function. [Docs](docs/readme.md#excluding-events-from-conversations)


Slack:

These fixes for the Slack connector add more ways to protect your bot from potentially malicious incoming webhook events. Use them!!

* Add optional Slack token verification to config - [Thanks @shishisharma](https://github.com/howdyai/botkit/pull/981)
* Apply verification middleware only on the webhook endpoint - [Thanks @nishant-chaturvedi](https://github.com/howdyai/botkit/pull/1203)

# 0.6.7

Add `controller.studio.getScripts()` to load all a list of available scripts from Botkit Studio [Docs](docs/readme-studio.md#controllerstudiogetscripts)

Add handling (and error messages) for 401 response codes from Botkit Studio APIs that indicate a bad access token

## 0.6.6

Important fixes to Facebook and Cisco Spark connectors: A breaking change was introduced in 0.6.5 which has now been fixed.

Remove `crypto` dependency, now use built-in crypto library.

Update `botkit-studio-sdk` dependency to latest version.

## 0.6.5

Introducing the Botkit command line tool!

Run: `npm install -g botkit`

Then, you'll be able to set up a new Botkit project (based on one of our excellent starter kits!) by typing:

`botkit new --name "my bot"`

New helper functions:

Botkit bots for Slack, Cisco Spark, Microsoft Teams and Facebook now have support for additional helper functions:

`bot.getMessageUser(message)` returns a Promise that will receive a normalized user profile object for the user who sent the message.

`bot.getInstanceInfo()` returns a Promise that will receive a normalized instance object, with `identity` and `team` fields.


## 0.6.4

Fix for Cisco Spark: improved methodology for detecting and handling @mentions

Fix for Slack: allow multiple validation errors to be passed in to `bot.dialogError()`.  Thanks @cfs! [PR #1080](https://github.com/howdyai/botkit/pull/1080)

Fix for Slack: fix for `bot.whisper()` Thanks to @jonchurch and @fletchrichman!

New: Botkit Studio scripts may now contain custom fields in message objects. This is in support of an upcoming feature in Botkit Studio which will allow developers to add define these custom fields in the Studio IDE.

## 0.6.3

New: Support for [Slack Dialogs](https://api.slack.com/dialogs), including:

* `bot.createDialog()` function [Docs](docs/readme-slack.md#dialogs)
* `bot.replyWithDialog()` function [Docs](docs/readme-slack.md#botreplywithdialog)
* `bot.api.dialog.open()` function
* `dialog_submission` event [Docs](docs/readme-slack.md#receive-dialog-submissions)
* `bot.dialogOk()` function [Docs](docs/readme-slack.md#botdialogok)
* `bot.dialogError()` function [Docs](docs/readme-slack.md#botdialogerror)

Fix: Cisco Spark bots will once again receive `direct_message` and `direct_mention` events. (Fix for [#1059](https://github.com/howdyai/botkit/issues/1059))

## 0.6.2

Fix bug in Facebook connector: call `startTicking()` as part of object instantiation. This was missing in 0.6 and 0.6.1

Move call to `startTicking()` in TwilioIPM connector to make it consistent with other connectors.

Fix: Catch 202 response code that does not have a JSON response body. This status sometimes comes back from the MS Teams API when a message has been queued for delivery.

## 0.6.1

Fix bugs in Botframework and ConsoleBot connectors that caused messages not to send. Resolves #1033.

Fix typo in Twilio connector that caused attached media to fail. Thanks @jpowers! [PR #1023](https://github.com/howdyai/botkit/pull/1023)

Fix missing `bodyParser` module in Facebook connector. Resolves #1041.

New: Add support for the new `conversations` APIs for Slack. [Read about this new API here](https://api.slack.com/docs/conversations-api).

New: Add `usergroups` APIs for Slack. Thanks to @digitalspecialists for this! [PR #1001](https://github.com/howdyai/botkit/pull/1001)

Change: Facebook `message_echo` webhooks will now emit `message_echo` events instead of `message_received` events to distinguish them from messages sent by users.


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

Adds support for Twilio IP Messaging bots

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
