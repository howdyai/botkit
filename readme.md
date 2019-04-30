# Botkit

**Botkit is the leading developer tool for building chat bots, apps and custom integrations for major messaging platforms.**

This repository contains the core Botkit library, as well as a series of plugins and extensions for connecting Botkit to messaging and chat platforms and other tools in the bot building ecosystem.

Botkit is part of the [Microsoft Bot Framework](https://dev.botframework.com)
and is released under the [MIT Open Source license](LICENSE.md)

# Use Botkit

* [Install Botkit and get started](packages/botkit#readme)
* [Botkit Core Docs](https://botkit.ai/docs/v4/)
* [Botkit Platform Support](https://botkit.ai/docs/v4/platforms/)
* [Botkit Class Reference](https://botkit.ai/docs/v4/reference/)

## Packages included in this repo

| Package | Description
|--- |---
| [botkit](packages/botkit) | Botkit Core library
| [botbuilder-adapter-websocket](packages/botbuilder-adapter-websocket) | A platform adapter for the web
| [botbuilder-adapter-slack](packages/botbuilder-adapter-slack) | A platform adapter for Slack
| [botbuilder-adapter-webex](packages/botbuilder-adapter-webex) | A platform adapter for Webex Teams
| [botbuilder-adapter-hangouts](packages/botbuilder-adapter-hangouts) | A platform adapter for Google Hangouts
| [botbuilder-adapter-twilio-sms](packages/botbuilder-adapter-twilio-sms) | A platform adapter for Twilio SMS
| [botbuilder-adapter-facebook](packages/botbuilder-facebook) | A platform adapter for Facebook Messenger
| [generator-botkit](packages/generator-botkit) | A Yeoman generator for creating a new Botkit project
| [botkit-plugin-cms](packages/botkit-plugin-cms) | A plugin that adds support for [Botkit CMS](https://github.com/howdyai/botkit-cms)

## Build Botkit locally

This repo contains multiple inter-linked packages containing Botkit Core, platform adapter packages, and some additional plugins and extensions.
To build these locally, follow the instructions below.

Install [lerna](https://github.com/lerna/lerna) and [TypeScript](https://www.typescriptlang.org/) globally:

```bash
npm install -g typescript
npm install -g lerna
```

Clone the entire Botkit project from Github.

```bash
git clone git@github.com:howdyai/botkit.git
```

Enter the new folder, and switch to the `next` branch.

```bash
cd botkit
git checkout next
npm install
```

Use lerna to set up the local packages:

```bash
lerna bootstrap --hoist
```

Now, build all of the libraries:

```bash
lerna run build
```

To build updated versions of the class reference documents found in `packages/docs`, run:

```bash
lerna run build-docs
```
