# Configure Botkit and Microsoft Teams
Building a bot with Botkit and the Microsoft Teams API gives you access to all of the best tools and options available to create a feature-rich app for Teams.

We've created the following guide to help you configure your Microsoft Teams bot. In order to get the best deploy experience possible, we recommend starting with [Botkit Studio](https://studio.botkit.ai/), our feature-rich tool for building bots!

## Step 0 - Enable Developer Preview

Before starting to work on your bot, you [should enable Developer Preview](https://msdn.microsoft.com/en-us/microsoft-teams/publicpreview#how-do-i-get-access) and the [ability to sideload apps](https://msdn.microsoft.com/en-us/microsoft-teams/setup#3-enable-sideloading-of-apps-for-microsoft-teams) for your development team so that you ensure all features are supported.

## Step 1 - Starting with Botkit Studio
Botkit Studio is a hosted development environment for building bots with the Botkit core library. Developers using Botkit Studio get the full capabilities of Botkit, plus a full guided setup on creating a bot for Microsoft Teams.

**[![Sign up for Botkit Studio](https://github.com/howdyai/botkit/blob/master/docs/studio.png)](https://studio.botkit.ai/signup?code=readme)**

Botkit Studio provides dedicated tools to create your bot's [App Package](https://botkit.groovehq.com/knowledge_base/topics/create-an-app-package-for-microsoft-teams) for [sideloading](https://msdn.microsoft.com/en-us/microsoft-teams/sideload) and submission to the Office Store. While Botkit Studio is not required, it is strongly recommended as the best way to stand up a bot using Botkit.

For more information about Botkit Studio, including our starter kits for other platforms, please read the [Botkit readme on GitHub](https://github.com/howdyai/botkit#start-with-botkit-studio).

## Step 2 Register your bot with Bot Framework
Microsoft Teams first requires you to register with their "Bot Framework" before you can add a bot to your Teams team. This is a multi-step process:

### Create an account / Log in

Log into the [Bot Framework Developer Portal](https://dev.botframework.com/bots/) using your Microsoft credentials, or create an account.

### Register a new bot
Once you are logged in, [click this link to create a new bot](https://dev.botframework.com/bots/new) and then you can skip the next two steps!

* Click on `My Bots` and then Register. Choose `Create a bot with the Bot Builder SDK`, and click `Create`. 

* Select `Register an existing bot built using Bot Builder SDK` from the next menu and then click `OK`.

You will be asked some questions about your bot. Some of these can be changed later, but some _cannot be changed_ so consider your responses carefully!

These are the important fields when creating your bot:

* `Display name` - Your bot's name in channels and directories. This can be changed later.
* `Bot handle` - This will be used in the URL for your bot. *Note: This cannot be changed.*
* `Messaging endpoint` - You may not know this yet, as you will be creating this in the next step when setting up the Botkit app. If you are using the [Botkit starter kit](https://github.com/howdyai/botkit-starter-teams) or [Botkit Studio](https://botkit.groovehq.com/knowledge_base/categories/microsoft-teams-2), by default it is: `https://YOURURL/teams/receive`. Feel free to make anything up, you can come back later and change it.

### Generate your keys
Register your bot with Microsoft by clicking: `Create Microsoft App ID and password`

This action will take you to a new website (and require you to log in again) and then ask you for an `App name`. 

Once added, it will provide an `App ID` which you need to copy somewhere safe to use in the next step.

Next, click `Generate password`. *This will only be shown to you once, if you lose it, you will need to invalidate the old one and set this up again!*

Click Register. 

### Add the Microsoft Teams channel

Add the Microsoft Teams channel from the list of channels, making sure the `Enabled` is set to on.

You will want to leave this window open as you finish setting up Botkit, as you will need to come back here before you are done.

## Step 4 - Deploy your bot and install to a team

### Turn on your Botkit app
Now that everything is setup on Microsoft's side, you can [run Botkit](https://github.com/howdyai/botkit/blob/master/docs/readme-teams.md#getting-started) using the method you've chosen and with the information created in the Bot framework in the previous step. 

### Update your Messaging Endpoint in Bot Framework
Once a Botkit instance is running, you may have a new URL that you will have to update in the bot's settings [in Microsoft Bot Framework](https://dev.botframework.com/bots/). 

Once logged in to that page:

* Click on your bot
* Select settings
* Scroll down to the messaging endpoint field and replace the placeholder URL with your active Botkit URL (it should look something like `https://YOURURL/teams/receive`).
* Click Save.

### Create your Application Manifest
To add a development bot on a team, you will need to prepare an [App Package](https://msdn.microsoft.com/en-us/microsoft-teams/createpackage). Botkit Studio provides [easy tools to create your App Package](https://botkit.groovehq.com/knowledge_base/topics/create-an-app-package-for-microsoft-teams), but you can also build this manifest manually if you've chosen to not use Studio.

### Sideload your Bot to Microsoft Teams
After creating your app package, you can [load it easily into your development team](https://msdn.microsoft.com/en-us/microsoft-teams/sideload#load-your-package-into-a-team). 

Say hello to your real live bot!

## Step 5 - Add dialogue and features
Once you have a bot up and running, you can start the fun part of [making your bot functional](https://github.com/howdyai/botkit/blob/master/docs/readme.md#basic-usage). 

You can extend your bot's functionality using various [Botkit Middleware](https://github.com/howdyai/botkit/blob/master/docs/middleware.md), or check our [example library](https://github.com/howdyai/botkit/tree/master/examples) for a good starting point.

If you have questions or suggestions, please take a look at our [community support resources](https://github.com/howdyai/botkit/blob/master/readme.md#developer--support-community). You can chat with contributors and enthusiasts in [our Slack community](https://community.botkit.ai/).

## Additional resources
* [Botkit Microsoft Teams readme](https://github.com/howdyai/botkit/blob/master/docs/readme-teams.md)
* [Microsoft's Bot Framework](https://dev.botframework.com/)
* [Sign up for Botkit Studio](https://studio.botkit.ai/signup)
