# botbuilder-webex adapter

Webex Teams bot adapter compatible with Microsoft Bot Builder and Botkit

### Using the Webex Teams Adapter


Import the Webex adapter.

```javascript
const { WebexAdapter } = require('botbuilder-webex');
```

Instantiate the adapter with a bot token and the url public url of your bot:

```javascript
const adapter = new WebexAdapter({
    access_token: process.env.access_token,
    public_address: process.env.public_address
});
```

Now, pass the adapter into Botkit when creating the controller:

```javascript
const controller = new Botkit({
    adapter: adapter
});
```

## Community & Support

Join our thriving community of Botkit developers and bot enthusiasts at large.
Over 10,000 members strong, [our open Slack group](https://community.botkit.ai) is
_the place_ for people interested in the art and science of making bots.
Come to ask questions, share your progress, and commune with your peers!

You can also find help from members of the Botkit team [in our dedicated Cisco Spark room](https://eurl.io/#SyNZuomKx)!

## About Botkit

Botkit is a part of the [Microsoft Bot Framework](https://dev.botframework.com).

Want to contribute? [Read the contributor guide](../../CONTRIBUTING.md)

Botkit is released under the [MIT Open Source license](LICENSE.md)