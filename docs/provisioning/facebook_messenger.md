# Configure Botkit and Facebook Messenger or Workplace


### 1. [Install Botkit](https://github.com/howdyai/botkit/blob/master/readme.md#start-with-botkit-studio)

### 2. Create a Facebook App for Web and note down or create a new Facebook Page. 

https://developers.facebook.com/tools-and-support/

Your Facebook page will be used for the app's identity.

### 3. Get a page access token for your app

Copy this token, you'll need it!

### 4. Define your own "verify token" - 

this is a string that you control that Facebook will use to verify your web hook endpoint

### 5. Run the example bot app, using the two tokens you just created. 




`Note` If you are not running your bot at a public, SSL-enabled internet address, use the --lt option and note the URL it gives you.

`page_token=<MY PAGE TOKEN> verify_token=<MY_VERIFY_TOKEN> node facebook_bot.js [--lt [--ltsubdomain CUSTOM_SUBDOMAIN]]`

### 6. Set up a webhook endpoint for your app that uses your public URL. 

Use the verify token you defined in step 4!
Note - You will need to provide Facebook a callback endpoint to receive requests from Facebook. By default Botkit will serve content from "https://YOURSERVER/facebook/receive". You can use a tool like ngrok.io or localtunnel.me to expose your local development enviroment to the outside world for the purposes of testing your Messenger bot.

Your bot should be online! Within Facebook, find your page, and click the "Message" button in the header.

Try:

who are you?
call me Bob
shutdown
Things to note

### 7. (Optional) Validate Requests - Secure your webhook!

Facebook sends an X-HUB signature header with requests to your webhook. You can verify the requests are coming from Facebook by enabling validate_requests: true when creating your bot controller. This checks the sha1 signature of the incoming payload against your Facebook App Secret (which is seperate from your webhook's verify_token), preventing unauthorized access to your webhook. You must also pass your app_secret into your environment variables when running your bot.

The Facebook App secret is available on the Overview page of your Facebook App's admin page. Click show to reveal it.

app_secret=abcdefg12345 page_token=123455abcd verify_token=VerIfY-tOkEn node facebook_bot.js

### 8. Customize your Bot

Using [Botkit Studio's conversation design tools](https://studio.botkit.ai) and the powerful [Botkit SDK](https://github.com/howdyai/botkit), you can build your dream bot!