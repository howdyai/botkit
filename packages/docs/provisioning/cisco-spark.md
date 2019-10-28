# Configure Botkit and Cisco Webex Teams

Setting up a bot for Cisco Webex Teams is one of the easiest experiences for bot developers! Follow these steps carefully to configure your bot.

### 1. Install Botkit

You will need to [install Botkit](../platforms/webex.md#get-started) and run it before your bot can be configured with Cisco Spark.

### 2. Create a new bot in the Cisco Developer portal

Follow the instructions to create a new bot in the [Cisco Webex Teams Developer Portal](https://developer.ciscospark.com/add-bot.html).

![Screenshot of the 'Add a bot' flow in Webex developer portal](IMG/cisco_add.png)

Take note of the bot username, you'll need it later.

**Note about your icon**: Cisco requires you host an avatar for your bot before you can create it in their portal. This bot needs to be a 512x512px image icon hosted anywhere on the web. This can be changed later.

You can copy and paste this URL for a Botkit icon you can use right away:

https://raw.githubusercontent.com/howdyai/botkit-starter-ciscospark/master/public/default_icon.png

### 3. Copy your access token

Cisco will provide you an `access token` that is specific to your bot. Write this down, you won't be able to see this later (but you will be able revoke it and create a new one).

### 4. Run your bot with variables set

 [Follow these instructions](../platforms/webex.md#get-started) to run your bot locally, or by using a third-party service such as [Glitch](https://glitch.com) or [Heroku](https://heroku.com).

 You will need the following environment variables when running your bot:

 * `access_token` = Your token from Webex Teams (**required**)
 * `secret` = User-defined string to validate payloads  (**required**)
 * `public_address`=  URL of your bot server (**required**)

You should now be able to search your Webex Teams for the bot username you defined, and add it to your team!

### Additional resources

Read more about making bots for this platform in the [Webex Developer Portal](https://developer.webex.com/docs/bots).
