# Configure Botkit and Microsoft Teams
Building a bot with Botkit and the Microsoft Teams API gives you access to all of the best tools and options available to create a feature-rich app for Teams.

We've created the following guide to help you configure your Microsoft Teams bot. 

## Step 1 Register your bot with Bot Framework
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
* `Messaging endpoint` - You may not know this yet, as you will be creating this in the next step when setting up the Botkit app. By default it is: `https://YOURURL/api/messages`.

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
Now that everything is setup on Microsoft's side, you can run Botkit with the information created in the Bot Framework.

### Update your Messaging Endpoint in Bot Framework
Once a Botkit instance is running, you may have a new URL that you will have to update in the bot's settings [in Microsoft Bot Framework](https://dev.botframework.com/bots/).

Once logged in to that page:

* Click on your bot
* Select settings
* Scroll down to the messaging endpoint field and replace the placeholder URL with your active Botkit URL (it should look something like `https://YOURURL/api/messages`).
* Click Save.

### Create your Application Manifest
To add a development bot on a team, you will need to prepare an [App Package](https://msdn.microsoft.com/en-us/microsoft-teams/createpackage).

### Sideload your Bot to Microsoft Teams
After creating your app package, you can [load it easily into your development team](https://msdn.microsoft.com/en-us/microsoft-teams/sideload#load-your-package-into-a-team).

Say hello to your real live bot!

## Step 5 - Add dialog and features
Once you have a bot up and running, you can start the fun part of [making your bot functional](../core.md).

If you have questions or suggestions, please take a look at our [community support resources](core.md#developer--support-community).

## Additional resources
* [Microsoft's Bot Framework](https://dev.botframework.com/)
