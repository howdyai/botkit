# Slack Adapter for Bot Builder

[lib/slack_adapter.js](lib/slack_adapter.js) is an adapter that connects bot builder to slack.

[index.js](index.js) is a single-team bot.

[multiteam.js](multiteam.js) is a multi-team bot that uses oauth.

## Single Team Bot

To configure for a single team, pass in a botToken provided by Slack's API portal:

```javascript
const adapter = new SlackAdapter({
    verificationToken: process.env.verificationToken,
    botToken: process.env.botToken,
});
```

## Multi-team Bot

Configure for multi-teams, pass in oauth client details and a function used to load the appropriate token for each team:

```javascript
const adapter = new SlackAdapter({
    verificationToken: process.env.verificationToken,
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['bot'],
    redirectUri: process.env.redirectUri,
    getTokenForTeam: getTokenForTeam,
    debug: true
});
```

In addition, configure at least an oauth redirect url to capture team configuration details:

```javascript
server.get('/install/auth', async (req, res) => {
    try {
        const results = await adapter.validateOauthCode(req.query.code);

        // Store token by team somehow.
        tokenCache[results.team_id] = results.bot.bot_access_token;

        res.json('Success! Bot installed.');

    } catch (err) {
        console.error('OAUTH ERROR:', err);
        res.status(401);
        res.send(err.message);
    }
});
```

And a function to pull the token back out:
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


# TODO

* write a readme
* implement signed secrets: https://api.slack.com/docs/verifying-requests-from-slack#a_recipe_for_security

* create conversationUpdate events?
* build helpers for building attachments?
* helpers for handling buttons or dialogs?
* helper for starting a DM with a specific user?
* Implement a middleware that reformats activities into the appropriate framework activity type and populates fields like membersAdded membersRemoved reactionsAdded reactionsRemoved
* figure out how to do mentions and direct_mentions
* strip mentions from front of string
* slash command replies
* reply in thread
* ephemeral
* replyinteractive
* dialog stuff
