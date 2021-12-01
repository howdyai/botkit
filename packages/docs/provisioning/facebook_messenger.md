# Configure Botkit and Facebook Messenger

*Note: This also applies for [Facebook Workplace](https://www.facebook.com/workplace)*

Facebook is a constantly evolving platform, nominally you can find everything you [need to create a bot](https://developers.facebook.com/docs/messenger-platform/guides/quick-start) on their platform page, but that information is subject to change.

### 1. [Install Botkit](../index.md)

Once installed, you will need to do steps 2-4, and steps 5 in parallel. It helps to have your development enviroment and the Facebook for Developers page open at the same time.

### 2. Create a Facebook App for Web

Visit [Facebook for Developers page](https://developers.facebook.com/tools-and-support/) and create a new app.

![Screenshot of create an APP ID in Facebook developer portal](IMG/fb_new.png)

* Select a Messenger application

![Screenshot of configuring your app in the Facebook developer portal](IMG/fb_mess.png)

### 3. Get a Page Access Token for your app
Scroll down to `Token Generation`

![Screenshot of page access tokens in Facebook portal](IMG/fb_tokengen.png)

If you have not yet created your page yet, you can go ahead and do this now, or associate this new bot with an existing page.

Copy this `Page Access Token`, you'll need it when running your bot.

### 4. Setup webhooks
Click  `Setup Webhooks` to link this application to your Botkit instance.

![Screenshot of configuring webhooks in the Facebook portal](IMG/fb_webhooks.png)

The callback url will be `https://YOURURL/api/messages`. This URL must be publically available, and SSL-secured. More information on this can be found in the next step.

You will also need to define a `Verify Token` for your page subscription. This is a user-defined string that you will keep secret and pass in with your environment variables.

### 5. Run your application

Run your application with your environment variables set:

* `page_token` - Your Page Access Token (**required**)
* `verify_token` - Your Verify Token (**required**)

If your application has been configured correctly, you will be able to talk to your bot through the page you specified in Step 3. Congratulations!

### Additional resources
*  [Botkit Facebook readme](../platforms/facebook.md)
*  [Botkit Facebook Starter Kit](https://github.com/howdyai/botkit-starter-facebook)
*  [Messenger Platform Documentation](https://developers.facebook.com/products/messenger/)
*  [Submit your bot so it can be publically available](https://developers.facebook.com/docs/messenger-platform/submission-process)
