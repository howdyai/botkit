# botbuilder-adapter-slack

## a Slack Adapter for BotBuilder and Botkit

[src/slack_adapter.ts](src/slack_adapter.ts) is an adapter that connects bot builder to slack.

[examples/index.js](examples/index.js) is a single-team bot.

[examples/multiteam.js](examples/multiteam.js) is a multi-team bot that uses oauth.

#### Using the Slack adapter for a single team

Import the Slack adapter.

```javascript
const { SlackAdapter } = require('botbuilder-slack');
```

Instantiate the adapter with a bot token and verification secret as provided in the Slack API dashboard.

```javascript
const adapter = new SlackAdapter({
    verificationToken: process.env.verificationToken,
    botToken: process.env.botToken,
});
```

Now, pass the adapter into Botkit when creating the controller:

```javascript
const controller = new Botkit({
    adapter: adapter
});
```

Messages will arrive as type `message`, while most other events will arrive as `event` types.  This may change to more closely conform to previous Botkit event types (direct_message, etc).  See [Slack event middleware](#slack-event-middleware)

#### Using the Slack adapter for multiple teams

When used with multiple teams, developers must provide a mechanism for storing and retrieving tokens provided during the oauth flow.  See below.

Import the Slack adapter.  

```javascript
const { SlackAdapter } = require('botbuilder-slack');
```

Instantiate the adapter with a `clientId`, `clientSecret`, scopes, redirectUrl and verification secret as provided/configured in the Slack API dashboard.

In addition, pass in a `getTokenForTeam` parameter containing a function in the form `async (teamId) => { return tokenForTeam; }`  This function is responsible for loading an API token from _somewhere_ and providing it to Botkit for use in handling incoming messages.


```javascript
const adapter = new SlackAdapter({
    verificationToken: process.env.verificationToken,
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['bot'],
    redirectUri: process.env.redirectUri,
    getTokenForTeam: getTokenForTeam,
});
```

Here is a simple implementation of getTokenForTeam which loads tokens from an in-memory cache. Developers should store their tokens in an encrypted database.

```javascript
const tokenCache = [];
async function getTokenForTeam(teamId) {
    if (tokenCache[teamId]) {
        return tokenCache[teamId];
    } else {
        console.error('Team not found in tokenCache: ', teamId);
    }
}
```

Now, pass the adapter into Botkit when creating the controller:

```javascript
const controller = new Botkit({
    adapter: adapter
});
```

Finally, expose new Oauth-related endpoints by binding new routes to the build in Express webserver accessible at `controller.webserver`.  Below is a simple implementation that stores the token provided by oauth in an in-memory cache.

```javascript
controller.webserver.get('/install', (req, res) => {
    // getInstallLink points to slack's oauth endpoint and includes clientId and scopes
    res.redirect(controller.adapter.getInstallLink());
});

controller.webserver.get('/install/auth', async (req, res) => {
    try {
        const results = await controller.adapter.validateOauthCode(req.query.code);

        tokenCache[results.team_id] = results.bot.bot_access_token;

        res.send('Success! Bot installed.');

    } catch (err) {
        console.error('OAUTH ERROR:', err);
        res.status(401);
        res.send(err.message);
    }
});
```

#### Slack event middleware

The slack adapter includes an optional middleware that will modify the `.type` field of incoming events to match their slack event types (rather than being cast into generic "message or "event" types).

NOTE that the technique currently used (changing the type field) can interfere with Microsoft BotBuilder dialogs, and will likely change in upcoming versions.

Import the adapter and the middleware:

```javascript
// load SlackAdapter AND SlackEventMiddleware
const { SlackAdapter, SlackEventMiddleware} = require('botbuilder-slack');
```

Create your adapter (as above), then bind the middleware to the adapter:

```javascript
adapter.use(new SlackEventMiddleware());
```

Now, Botkit will emit events with their original Slack names:

```
controller.on('channel_join', async(bot, message) => {
    // do stuff
});
```