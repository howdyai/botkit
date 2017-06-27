# Botkit and Twilio Programmable SMS

Botkit is designed to ease the process of designing and running useful, creative bots that live inside [Slack](http://slack.com), [Facebook Messenger](http://facebook.com), [Twilio IP Messaging](https://www.twilio.com/docs/api/ip-messaging), and other messaging platforms like [Twilio's Programmable SMS](https://www.twilio.com/sms/).

Botkit features a comprehensive set of tools to deal with [Twilio's Programmable SMS API](http://www.twilio.com/sms/), and allows developers to build interactive bots and applications that send and receive messages just like real humans. Twilio SMS bots receive and send messages through a regular phone number.

This document covers the Twilio Programmable SMS API implementation details only. [Start here](readme.md) if you want to learn about how to develop with Botkit.

# Getting Started

1) Install Botkit [more info here](readme.md#installation)

2) Register a developer account with Twilio. Once you've got it, head to the [Get Started with SMS](https://www.twilio.com/console/sms/getting-started/basics) page in your Twilio Console.

After completing the tutorial above you should have all three values to get your bot running: A **Twilio Account SID**, a **Twilio Auth Token**, and a **Twilio Number**.

**Twilio Account SID and Auth Token**

These values are available on your [Twilio Account Settings](https://www.twilio.com/user/account/settings) page on the Twilio Console. Copy both the SID and token values (located under API Credentials)

**Twilio Number**

You should have purchased a Twilio Number. You will send/receive messages using this phone number. Example: `+19098765432`

4) Configure your Twilio Number. Head to the [Phone Numbers](https://www.twilio.com/console/phone-numbers) in your Twilio Console and select the phone number you will use for your SMS bot.

Under the *Messaging* section, select "Webhooks/TwiML" as your *Configure with* preference. Two more fields will pop up: ***A message comes in***, and ***Primary handler fails***.

The first one is the type of handler you will use to respond to Twilio webhooks. Select "Webhook" and input the URI of your endpoint (e.g. `https://mysmsbot.localtunnel.me/sms/receive`) and select `HTTP POST` as your handling method.

Twilio will send `POST` request to this address every time a user sends an SMS to your Twilio Number.

> By default Botkit will serve content from `https://YOURSERVER/sms/receive`. If you are not running your bot on a public, SSL-enabled internet address, you can use a tool like [ngrok.io](http://ngrok.io/) or [localtunnel.me](localtunnel.me) to expose your local development enviroment to the outside world for the purposes of testing your SMS bot.

The second preference ("Primary handler fails") is your backup plan. The URI Twilio should `POST` to in case your primary handler is unavailable. You can leave this field in blank for now but keep in mind this is useful for error handling (e.g. to notify users that your bot is unavailable).

5) Run the example Twilio SMS bot included in Botkit's repository ([`./twilio_sms_bot.js`](twilio_sms_bot.js)). Copy and paste the example bot's code into a new JavaScript file (e.g. `twilio_sms_bot.js`) in your current working directory and run the following command on your terminal:

```bash
$ TWILIO_ACCOUNT_SID=<YOUR_ACCOUNT_SID> TWILIO_AUTH_TOKEN=<YOUR_AUTH_TOKEN> TWILIO_NUMBER=<YOUR_NUMBER> node twilio_sms_bot.js
```

> Note: Remember to run localtunnel or ngrok to expose your local development environment to the outside world. For example, in localtunnel run `lt --port 5000 --subdomain mysmsbot` (See note on step 4)

6) Your bot should be online! Grab your phone and text `hi` to your Twilio Number and you will get a `Hello.` message back!

Try the following messages: `Hi`, `Call me bob`, `what's my name?`

### What now?

Head over to [Botkit's core guide](https://github.com/howdyai/botkit/blob/master/docs/readme.md) to know how to build bots!
