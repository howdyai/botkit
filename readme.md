# Botkit Next Major Release

This branch is home to the next major release of Botkit, which is based on a complete rewrite of the library.

**This is a not a finished product!** We are publishing it now as a preview so our community of 
developers, users and contributors can get involved. Some features are missing or not working,
and some features currently included may be removed. 

<a href="https://github.com/howdyai/botkit/projects/9">View the roadmap planning board for this release</a>

GOALS:
* Keep as much of the feature set, syntax and special sauce developers know and love
* Solve persistent and hard to solve problems in previous versions of Botkit
* Use modern JavaScript language features like async/await instead of callbacks
* Full Typescript support
* Break platform adapters (and their large dependency trees) into optional packages
* Reorganize some related projects into a monorepo
* Inherit much goodness from [Bot Builder](https://github.com/microsoft/botbuilder-js)
* Provide a way for bots to be extended with plugins and modular features, and for those plugins to provide a consistent interface to administrators

## Packages included in this repo

| Package | Description
|--- |---
| [botkit](packages/botkit) | Botkit Core library
| [botbuilder-websocket](packages/botbuilder-websocket) | A platform adapter for the web
| [botbuilder-slack](packages/botbuilder-slack) | A platform adapter for Slack
| [botbuilder-webex](packages/botbuilder-webex) | A platform adapter for Webex Teams
| [botbuilder-hangouts](packages/botbuilder-hangouts) | A platform adapter for Google Hangouts
| [botbuilder-facebook](packages/botbuilder-facebook) | A platform adapter for Facebook Messenger
| [generator-botkit](packages/generator-botkit) | A Yeoman generator for creating a new Botkit project

| [botbuilder-dialogs-botkit-cms](packages/botbuilder-dialogs-botkit-cms) | A library that allows using Botkit CMS content in Bot Builder apps (without Botkit)


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

# Docs

[Get Started](packages/botkit)

[Botkit Core Docs](docs/index.md)
