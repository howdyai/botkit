const { WebexAdapter } = require('../lib/webex_adapter');

const restify = require('restify');

const adapter = new WebexAdapter({
    access_token: process.env.access_token,
    public_address: process.env.public_address
});

adapter.registerWebhookSubscription('/api/messages');

// Create HTTP server
let server = restify.createServer();
server.use(restify.plugins.bodyParser({ mapParams: false }));
server.listen(process.env.port || process.env.PORT || 3000, function() {
    console.log(`\n${ server.name } listening to ${ server.url }`);
});


server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        console.log('RECEIVED', context.activity);
    });
});