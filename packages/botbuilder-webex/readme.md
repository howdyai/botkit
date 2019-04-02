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