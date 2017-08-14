# Configure Botkit and Microsoft Teams
Building a bot with Botkit and the Microsoft Teams API gives you access to all of the best tools and options available to create a feature-rich app for Teams.

We've created the following guide to help you configure your Microsoft Teams bot. In order to get the best deploy experience possible, we recommend starting with [Botkit Studio](https://studio.botkit.ai/), our feature-rich tool for building bots!

## Starting with Botkit Studio
Botkit Studio is a hosted development environment for building bots with the Botkit core library. Developers using Botkit Studio get the full capabilities of Botkit, plus a full guided setup on creating a bot for Microsoft Teams.

Botkit Studio provides dedicated tools to create your bot's [App Package](https://botkit.groovehq.com/knowledge_base/topics/create-an-app-package-for-microsoft-teams) for [sideloading](https://msdn.microsoft.com/en-us/microsoft-teams/sideload) and submission to the Office Store. While Botkit Studio is not required, but it is strongly recomended as the best way to stand up a bot using Botkit.

For more information about Botkit Studio, including our starter kits for other platforms, please read the [Botkit readme on GitHub](https://github.com/howdyai/botkit#start-with-botkit-studio).

## Register your bot with Bot Framework
You will need to complete the following registration steps to obtain the keys needed to operate your bot.

### Step 1 - Create an account / Log in

Log into the [Bot Framework Developer Portal](https://dev.botframework.com/bots/) using your Microsoft credentials.

### Step 2 - Complete Bot Profile

Click on `My Bots` and then Register.

You will be asked some questions about your bot. Some of these can be changed later, but some _cannot be changed_ so consider your responses carefully!

These are the important fields when creating your bot:

* `Display name` - Your bot's name in channels and directories. This can be changed later.
* `Bot handle` - This will be used in the URL for your bot. _NOTE: This cannot be changed._
* `Messaging endpoint` - You may not know this yet, you will be creating this in the next step when setting up the Botkit app. If you are using the [Botkit starter kit]() or [Botkit Studio](), by default it is: `https://YOURURL/microsoft/receive`

### Step 3 - Generate your keys

Register your bot with Microsoft by clcking `Create Microsoft App ID and password`.

This action will take you to a new website (you will have to log in again) and ask you for an `App name`.

Once added, it will provide an `App ID` which you need to copy somewhere safe to use in the next step.

Next, click `Generate password`. This will only be shown to you once, if you lose it, you will need to set this up again!

Click Register.

Add the Micrososft Teams channel from the list of channels, making sure the `Enabled` is set to on.

Now you can finish setting up your Botkit instance.

### Step 4 - Deploy your bot


## Turn on your Botkit app
Now that everything is setup on Microsoft's side, you can [run your bot](https://github.com/howdyai/botkit/blob/master/docs/readme-msteams.md#getting-started) using the hosting method you've chosen. You can use Microsoft's [web simulator](https://dev.botframework.com/bots) to test basic functionality by clicking on your bot's name then clicking `Test`.

The web simulator is a great way to ensure your development enviroment is functioning, but the best way to work on your bot is to sideload it onto an actual team. To do this, you will need to prepare an [App Package](https://msdn.microsoft.com/en-us/microsoft-teams/createpackage)  and follow the [instructions for sideloading](https://msdn.microsoft.com/en-us/microsoft-teams/sideload).

Botkit Studio provides [easy tools to create your App Package](https://botkit.groovehq.com/knowledge_base/topics/create-an-app-package-for-microsoft-teams), but you can build this manifest manually if you've chosen to not use Studio.

## Create your Application Manifest


## Sideload your Bot to Microsoft Teams


## Add dialogue and features
Once you have a bot up and running, you can start the fun part of [making your bot functional](https://github.com/howdyai/botkit/blob/master/docs/readme.md#basic-usage). You can extend your bot's functionality using various [Botkit Middleware](https://github.com/howdyai/botkit/blob/master/docs/middleware.md), or check our [example library](https://github.com/howdyai/botkit/tree/master/examples) for a good starting point.

If you have questions or suggestions, please take a look at our [community support resources](https://github.com/howdyai/botkit/blob/master/readme.md#developer--support-community). You can chat with contributors and enthusiasts in [our Slack community](https://community,botkit.ai/).

## Additional resources
* [Botkit Microsoft Teams readme](https://github.com/howdyai/botkit/blob/master/docs/readme-msteams.md)
* [Microsoft's Bot Framework](https://dev.botframework.com/)
* [Sign up for Botkit Studio](https://studio.botkit.ai/signup) 
