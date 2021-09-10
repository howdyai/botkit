# ![Botkit](banner.png)

**Botkit is an open source developer tool for building chat bots, apps and custom integrations for major messaging platforms.**

This repository contains the core Botkit library, as well as a series of plugins and extensions for connecting Botkit to messaging and chat platforms and other tools in the bot building ecosystem.

Botkit is part of the [Microsoft Bot Framework](https://dev.botframework.com)
and is released under the [MIT Open Source license](LICENSE.md)

# Use Botkit

* [Install Botkit and get started](packages/botkit#readme)
* [Botkit Core Docs](https://github.com/howdyai/botkit/blob/main/packages/docs/index.md)
* [Botkit Platform Support](https://github.com/howdyai/botkit/blob/main/packages/docs/platforms/index.md)
* [Botkit Class Reference](https://github.com/howdyai/botkit/blob/main/packages/docs/reference/index.md)

## Packages included in this repo

| Package | Description | NPM Status
|--- |--- |---
| [botkit](packages/botkit) | Botkit Core library | [![NPM Badge](https://img.shields.io/npm/dw/botkit.svg?logo=npm)](https://www.npmjs.com/package/botkit/) 
| [botbuilder-adapter-web](packages/botbuilder-adapter-web) | A platform adapter for the web | [![NPM Badge](https://img.shields.io/npm/dw/botbuilder-adapter-web.svg?logo=npm)](https://www.npmjs.com/package/botbuilder-adapter-web) 
| [botbuilder-adapter-slack](packages/botbuilder-adapter-slack) | A platform adapter for Slack | [![NPM Badge](https://img.shields.io/npm/dw/botbuilder-adapter-slack.svg?logo=npm)](https://www.npmjs.com/package/botbuilder-adapter-slack) 
| [botbuilder-adapter-webex](packages/botbuilder-adapter-webex) | A platform adapter for Webex Teams | [![NPM Badge](https://img.shields.io/npm/dw/botbuilder-adapter-webex.svg?logo=npm)](https://www.npmjs.com/package/botbuilder-adapter-webex) 
| [botbuilder-adapter-hangouts](packages/botbuilder-adapter-hangouts) | A platform adapter for Google  | [![NPM Badge](https://img.shields.io/npm/dw/botbuilder-adapter-hangouts.svg?logo=npm)](https://www.npmjs.com/package/botbuilder-adapter-hangouts)
| [botbuilder-adapter-twilio-sms](packages/botbuilder-adapter-twilio-sms) | A platform adapter for Twilio SMS | [![NPM Badge](https://img.shields.io/npm/dw/botbuilder-adapter-twilio-sms.svg?logo=npm)](https://www.npmjs.com/package/botbuilder-adapter-twilio-sms) 
| [botbuilder-adapter-facebook](packages/botbuilder-adapter-facebook) | A platform adapter for Facebook Messenger | [![NPM Badge](https://img.shields.io/npm/dw/botbuilder-adapter-facebook.svg?logo=npm)](https://www.npmjs.com/package/botbuilder-adapter-facebook) 
| [generator-botkit](packages/generator-botkit) | A Yeoman generator for creating a new Botkit project | [![NPM Badge](https://img.shields.io/npm/dw/generator-botkit.svg?logo=npm)](https://www.npmjs.com/package/generator-botkit) 
| [botkit-plugin-cms](packages/botkit-plugin-cms) | A plugin that adds support for [Botkit CMS](https://github.com/howdyai/botkit-cms) | [![NPM Badge](https://img.shields.io/npm/dw/botkit-plugin-cms.svg?logo=npm)](https://www.npmjs.com/package/botkit-plugin-cms)

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

Enter the new folder and install the dependent packages:

```bash
cd botkit
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
