# Robustness and Performance Tests 
Bot evaluation is a crucial phase to make sure that your users receive the "correct" answers, "always". 
To test a bot application, you should simulate FAcebook's call to your bot. 
To do so, the bot application receiving channel should be detached to Facebook App.

Facebook sends a POST request using the Webhook url. The request wrapps a JSON Object in which is specified the sender, recipient, message and more. 

Here's a example of the JSON Object to send : 

```
{
    "object":"page",
    "entry":[
        {
            "messaging":[
                {
                    "message":{
                        "text":"Hello",
                        "seq":20,
                        "mid":"mid.1466015596912:73e4cfddf9148aba4d"
                    },
                    "timestamp":1466015596919,
                    "sender":{
                        "id":"USER_ID_IN_PAGE_SCOPE"
                    },
                    "recipient":{
                        "id":"PAGE_ID"
                    }
                }
            ],
            "time":1466015596947,
            "id":"260317677677806"
        }
    ]
}

```
- sender : Should be a valid user_id of your page. Because this object should simulate the message sent by a user to the page.
- recipient : your page id to which the message should be sent.

Finally, here's a curl used to perform tests : 

```
curl -X POST \
  WEBHOOK_URL/facebook/receive/ \
  -H 'content-type: application/json' \
  -d '{
    "object":"page",
    "entry":[
        {
            "messaging":[
                {
                    "message":{
                        "text":"Hello",
                        "seq":20,
                        "mid":"mid.1466015596912:73e4cfddf9148aba4d"
                    },
                    "timestamp":1466015596919,
                    "sender":{
                        "id":"USER_ID_IN_PAGE_SCOPE"
                    },
                    "recipient":{
                        "id":"PAGE_ID"
                    }
                }
            ],
            "time":1466015596947,
            "id":"260317677677806"
        }
    ]}'
```

To test the correctness of your app, compare the number of times you sent this request with the number of times the bot responses with the correct answer to this user. 
This way, interrupted conversations or lost requests can be detected.
