var josh_SID = 'AC2d96f61546e749fc16919ab3ae82f860';
var josh_token = 'a79605561452bd0c0b9e3a8cfff3c03c';
//set this flag to a process.env.debug flag prob
//require the Twilio module and create a REST client
var client = require('twilio')(josh_SID, josh_token);
console.log("HI");

//Send an SMS text message
var questions = ['What week are you evaluating?(1-6)', 'Please rate the overall content for this week?(1-6)', 'Please tell me which speakers/activities you preferred and why?']

//'+15005550006'

//essage.to = '+15064706220';
//message.from = '+15878011927';
//message.body = 'This is a weekly Survey!';

client.sendMessage({

    to:'+15064706220', // Any number Twilio can deliver to
    from: '+15878011927', // A number you bought from Twilio and can use for outbound communication
    body: 'This is a test from josh.' // body of the SMS message
}
, function(err, responseData) { //this function is executed when a response is received from Twilio

    if (err) {
        console.log(err);
    }
    else {
      console.log(responseData.from); // outputs "+14506667788"
      console.log(responseData.body); // outputs "word to your mother."
    }
});
