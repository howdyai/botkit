# Configure Botkit and Facebook Messenger or Workplace


### 1. [Install Botkit](https://github.com/howdyai/botkit/blob/master/readme.md#start-with-botkit-studio)

### 2. Create a Facebook App for Web


[Visit the developer page and create a new app](https://developers.facebook.com/tools-and-support/)
![Create your APP ID](IMG/fb_new.png)

* Select a Messenger application

![Create your app](IMG/fb_mess.png)


### 3. Get a page access token for your app
Scroll down to `Token Generation`

![page access token](IMG/fb_tokengen.png)


If you have not yet created your page yet, you can go ahead and do this now, or associate this new bot with an existing page.

Copy this token, you'll need it!

### 4. Setup webhooks 
Click  `Setup webhooks` to link this application to your Botkit instance.

![page access token](IMG/fb_webhooks.png)

The callback url will be `https://YOURURL/facebookreceive`. This url must be publically available, and SSL-secured. More information on this can be found in the next step.

### 5. Run your application!

### 6. (Optional) Validate Requests - Secure your webhook!

Facebook sends an X-HUB signature header with requests to your webhook. You can verify the requests are coming from Facebook by enabling validate_requests: true when creating your bot controller. This checks the sha1 signature of the incoming payload against your Facebook App Secret (which is seperate from your webhook's verify_token), preventing unauthorized access to your webhook. You must also pass your app_secret into your environment variables when running your bot.

The Facebook App secret is available on the Overview page of your Facebook App's admin page. Click show to reveal it.

app_secret=abcdefg12345 page_token=123455abcd verify_token=VerIfY-tOkEn node facebook_bot.js

### 8. Customize your Bot

Using [Botkit Studio's conversation design tools](https://studio.botkit.ai) and the powerful [Botkit SDK](https://github.com/howdyai/botkit), you can build your dream bot!