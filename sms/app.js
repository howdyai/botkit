var express = require('express');
var mongoose = require('mongoose');
var app = express();
var port = 8000;


var db = mongoose.connect('mongodb://107.170.21.178/smsAPI');

var sms = require('./models/smsModel');
var smsRouter = express.Router();

smsRouter.route('/smss')
  .get(function(req, res){
    Sms.find(function(err, smss){
        if(err)
          console.log(err);
        else
          res.json(smss);
    });
  });

app.use('/api', smsRouter);


app.get('/', function(req, res){
  res.send("welcome to my api!");
});

app.listen(port, function(){
  console.log('Running on Port:' + port);
});
