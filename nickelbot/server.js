var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

app.get('/', function (req, res) {
    res.send('Hello World');
})

var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})

/* WebHook Post entry point. */
app.post('/webhook', jsonParser, function(req, res, next) {
        console.log("Webhook received!");
        console.log('req',req);
        console.log('req.body',req.body);
        // console.log("Repo is " + req.body.repository.name);
        // console.log("User is " + req.body.actor.username);
        // req.body.push.changes.forEach(function (commit) {
        //     console.log("Branch/Tag is " + commit.new.name);
        //     console.log("Type is " + commit.new.type);
        // });
        res.send('yay, webhook works!');
});
