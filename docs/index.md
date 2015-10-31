# Botkit

## Installation

Get botkit from NPM

```
npm install --save botkit
```


## Basic Usage

```
var botkit = require('botkit');

var bot = botkit.slackbot(configuration);
bot.init();

```

## Single Team Bot

Use botkit to build a bot that will connect to your team (one team at a time).

These can just be manually configured by putting info into the script or environment variables!


## Multi Team Bot

This requires using oauth and the add to slack features.

also requires storing provisioning info for teams.


## Working with Slack Integrations

* Incoming webhooks (send data to slack)

* Outgoing webhooks (data sent from slack based on keyword)
* Slash commands (data sent from slack using a special command)

* RTM api / bot users (real user that receives all messages)


## Event Handlers

## Tasks and Conversations
