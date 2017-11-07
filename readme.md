# [Botkit](https://botkit.ai) - Building Blocks for Building Bots

[![npm](https://img.shields.io/npm/v/botkit.svg)](https://www.npmjs.com/package/botkit)
[![David](https://img.shields.io/david/howdyai/botkit.svg)](https://david-dm.org/howdyai/botkit)
[![npm](https://img.shields.io/npm/l/botkit.svg)](https://spdx.org/licenses/MIT)
[![bitHound Overall Score](https://www.bithound.io/github/howdyai/botkit/badges/score.svg)](https://www.bithound.io/github/howdyai/botkit)

Botkit is designed to ease the process of designing and running useful, creative bots that live inside messaging platforms.
Bots are applications that can send and receive messages, and in many cases, appear alongside their human counterparts as _users._

Some bots talk like people, others silently work in the background, while others present interfaces much like modern mobile applications.
Botkit gives developers the necessary tools for building bots of any kind! It provides an easy-to-understand interface for sending and receiving messages so that developers can focus on creating novel applications and experiences instead of dealing with API endpoints.

Our goal with Botkit is to make bot building easy, fun, and accessible to anyone with the desire to create
a future filled with talking machines! We provide several tools to make this vision a reality:

* [Botkit Studio](#start-with-botkit-studio), an integrated development environment for designing and building bots
* [Starter Kits](#start-with-a-starter-kit), boilerplate applications pre-configured to work with popular platforms
* [Botkit Core Library](#botkit-core-library), an SDK for creating conversational software
* [Plugins and Middlewares](docs/readme-middlewares.md) that can extend and enhance your bot

Botkit features a comprehensive set of tools to deal with popular messaging platforms, including:

* [Slack](docs/readme-slack.md)
* [Cisco Spark](docs/readme-ciscospark.md)
* [Microsoft Teams](docs/readme-teams.md)
* [Facebook Messenger and Facebook @Workplace](docs/readme-facebook.md)
* [Twilio SMS Messaging](docs/readme-twiliosms.md)
* [Twilio IP Messaging](docs/readme-twilioipm.md)
* [Microsoft Bot Framework](docs/readme-botframework.md)
* Yours? [info@howdy.ai](mailto:info@howdy.ai)

---

## [Start with Botkit Studio](https://studio.botkit.ai/signup)

Botkit Studio is a hosted development environment for building bots with Botkit.
Developers using Botkit Studio get the full capabilities of Botkit, with the addition of many powerful bot-building features such as:

* All the code you need to get your bot online in minutes
* A visual authoring environment for designing and managing dialog
* A real-time message console for monitoring activity
* APIs that enable content and features to be added to bots without additional code
* Role-based, multi-user teams support
* Detailed usage statistics
* Built-in integrations with top plugins and platform tools

Click below to sign up for a free developer account, [and please contact us if you have any questions.](mailto:info@howdy.ai)

**[![Sign up for Botkit Studio](docs/studio.png)](https://studio.botkit.ai/signup?code=readme)**


## Start with a Starter Kit

Based on the best practices we've established since the release of Botkit, our starter kits include
everything you need to bring a Botkit bot online in minutes. Don't start from scratch -- start with a
well structured, extensible application boilerplate!

These starter kits are easy to set up and run on your own hosting service, but the fastest (and cheapest) way to get
started is to deploy directly to [Glitch](http://glitch.com), a free-to-use code editor and hosting system!

Note: While [using Botkit Studio](https://studio.botkit.ai) is highly recommended, these starter kits can be used without registering for Studio as well.

> ### [Slack Bot Starter Kit](https://github.com/howdyai/botkit-starter-slack)
> The Slack starter kit contains everything you need to create a multi-team Slack application,
suitable for internal use or submission to [Slack's app store.](https://slack.com/apps)
> #### [![Remix on Glitch](docs/glitch.png)](https://glitch.com/~botkit-slack)

> ### [Cisco Spark Bot Starter Kit](https://github.com/howdyai/botkit-starter-ciscospark)
> Build a bot inside Cisco Spark's collaboration and messaging platform. Bots built with the starter kit
are ready to submit to [Cisco Spark's Depot app store](https://depot.ciscospark.com/).
> #### [![Remix on Glitch](docs/glitch.png)](https://glitch.com/~botkit-ciscospark)

> ### [Microsoft Teams Bot Starter Kit](https://github.com/howdyai/botkit-starter-teams)
> Connect your bot to Microsoft Teams, and it can do things like no other bot, like create tabs, compose extensions, and other deep integrations into the messaging UI.
> #### [![Remix on Glitch](docs/glitch.png)](https://glitch.com/~botkit-teams)

> ### [Facebook Bot Starter Kit](https://github.com/howdyai/botkit-starter-facebook)
> The Facebook starter kit contains all the code necessary to stand up a Facebook bot on either Facebook Messenger, or Facebook Work Chat. With just a few pieces of configuration, set up a bot that automatically responds to messages sent to your Facebook page.
> #### [![Remix on Glitch](docs/glitch.png)](https://glitch.com/~botkit-facebook)

# Developer & Support Community

Join our thriving community of Botkit developers and bot enthusiasts at large.
Over 4500 members strong, [our open Slack group](https://community.botkit.ai) is
_the place_ for people interested in the art and science of making bots.
Come to ask questions, share your progress, and commune with your peers!

You can also find help from members of the Botkit team [in our dedicated Cisco Spark room](https://eurl.io/#SyNZuomKx)!

We also host a [regular meetup and annual conference called TALKABOT.](https://talkabot.ai)
Come meet and learn from other bot developers! [Full video of our 2016 event is available on Youtube.](https://www.youtube.com/playlist?list=PLD3JNfKLDs7WsEHSal2cfwG0Fex7A6aok)



# Botkit Core Library

Botkit is designed around the idea of giving developers a language-like interface for building bots.
Instead of dealing directly with messaging platform protocols and APIs, Botkit provides semantic functions
designed around the normal parts of human conversation: _hearing things_ and _saying things_.

On top of these basic build blocks, Botkit offers a powerful system for creating and managing dynamic
conversational interfaces, and tapping into cutting edge technology like artificial intelligence (AI)
and natural language understanding (NLP/NLU) tools.

Practically speaking, this results in code that looks like this:

```javascript
// respond when a user sends a DM to the bot that says "hello"
controller.hears('hello', 'direct_message', function(bot, message) {
    bot.reply(message, 'Hello human.');
});
```

All Botkit bots, built for any platform, use these same building blocks. This means developers are not required
to learn the intricacies of each platform, and can build bots that port easily between them.

Botkit can be used to build a stand-alone application, or it can be integrated into existing Node.js
apps to offer a bot experience, or to send application notifications into messaging apps. It is released
under the [MIT open source license](LICENSE.md), which means developers are free to use it any way they choose,
in any type of project.


## Install Botkit from NPM or Github

Botkit is available via NPM.

```bash
npm install --save botkit
```

You can also check out Botkit directly from Git.
If you want to use the example code and included bots, it may be preferable to use Github over NPM.

```bash
git clone git@github.com:howdyai/botkit.git
```

After cloning the Git repository, you have to install the node dependencies. Navigate to the root of your cloned repository and use npm to install all necessary dependencies.
```bash
npm install
```

Use the `--production` flag to skip the installation of devDependencies from Botkit. Useful if you just wish to run the example bot.
```bash
npm install --production
```

## Running Tests

To run tests, use the npm `test` command. Note: you will need dev dependencies installed using `npm install`.

```bash
npm test
```

To run tests in watch mode run:

```bash
npm run test-watch
```

Tests are run with [Jest](https://facebook.github.io/jest/docs/getting-started.html). You can pass Jest command line options after a `--`.
For example to have Jest bail on the first error you can run

```bash
npm test -- --bail
```

## Documentation

* [Get Started](docs/readme.md)
* [Botkit Studio API](docs/readme-studio.md)
* [Function index](docs/readme.md#developing-with-botkit)
* [Extending Botkit with Plugins and Middleware](docs/middleware.md)
  * [Message Pipeline](docs/readme-pipeline.md)
  * [List of current plugins](docs/readme-middlewares.md)
* [Storing Information](docs/storage.md)
* [Logging](docs/logging.md)
* Platforms
  * [Slack](docs/readme-slack.md)
  * [Cisco Spark](docs/readme-ciscospark.md)
  * [Microsoft Teams](docs/readme-teams.md)
  * [Facebook Messenger](docs/readme-facebook.md)
  * [Twilio SMS](docs/readme-twiliosms.md)
  * [Twilio IPM](docs/readme-twilioipm.md)
  * [Microsoft Bot Framework](docs/readme-botframework.md)
* Contributing to Botkit
  * [Contributing to Botkit Core](CONTRIBUTING.md)
  * [Building Middleware/plugins](docs/howto/build_middleware.md)
  * [Building platform connectors](docs/howto/build_connector.md)

# About Botkit

Botkit is a product of [Howdy](https://howdy.ai).

For support, check out [the Developer Community](#developer--support-community) and find our team in the #Botkit channel.
