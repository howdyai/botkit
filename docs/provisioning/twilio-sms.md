# Configure Botkit and Twilio SMS

Setting up a bot for Twilio SMS is one of the easiest experiences for bot developers! Follow these steps carefully to configure your bot.

### 1. Install Botkit

The easiest path to creating a new bot for Twilio SMS is through Botkit Studio. [Sign up for an account here](https://studio.botkit.ai/signup/). This method will provide a guided path to hosting, along with other useful tools for creating and managing your bot.

For advanced users looking to run their own code, you will need to [install Botkit](../readme-twilio-sms.md#getting-started) and run it before your bot can be configured with Twilio SMS.

### 2. Create a new bot in the Twilio Developer Console

Login and click `Get Started`  in [Twilio SMS Developer Console](https://www.twilio.com/console/sms/dashboard). You will be taken through the process of obtaining a number to use with your bot.

At this point you can use the Twilio wizard to help you create an application, or build one directly by clicking `Messanging Services`. You can give it a friendly, and chose `Mixed` for use case.

Check the box `Process Inbound Messages` and under request URL, type the name of your request url.

By default in Botkit, this is:
https://*mybot.yoururl.com*/sms/receive

### 3. Collect your tokens

Next, visit [your console Dashboard](https://www.twilio.com/console) and copy your `Account SID` and `Auth Token`. You will use these in the next step along with your assignedmobile number to setup Botkit.

### 4. Run your bot with variables set

 [Follow these instructions](../readme-TwilioSMS.md#getting-started) to run your bot locally, or by using a third-party service such as [Glitch](https://glitch.com) or [Heroku](https://heroku.com).

 You will need the following environment variables when running your bot:

* TWILIO_ACCOUNT_SID= Your account's SID collected in step 3 above.
* TWILIO_AUTH_TOKEN= Your account's Auth Token collected in step 3 above.
* TWILIO_NUMBER= The number you were assigned in step 2 above.

You should now be able to text message your number the words `Hello` and receive a friendly reply back!

### Additional resources

Read more about making bots for this platform in the [Twilio Developer Portal](https://www.twilio.com/console).
