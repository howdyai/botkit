var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var SlackBot = require('./slack.js');

var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})

var nickelBot = new SlackBot(process.env.token);

app.get('/', function (req, res) {
    res.send('Hello World');
})

/* WebHook Post entry point. */
app.post('/webhook', jsonParser, function(req, res, next) {
        console.log('Webhook received!');
        console.log('[response body]',req.body);

        res.send('yay, webhook works!');
});
