/* TODO bot that demonstrates sending incmoing webhooks to one specific team */
app.get('/webhook', function (req, res) {
  if (req.query['hub.verify_token'] === <YOUR_VERIFY_TOKEN>) {
    res.send(req.query['hub.challenge']);
  } else {
    res.send('Error, wrong validation token');
  }
});
