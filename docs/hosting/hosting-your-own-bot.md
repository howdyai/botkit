# How To Host Your Botkit App

This is a placeholder for forthcoming docs. Sorry!

## the gist

Get a server somewhere. [Digital Ocean](https://m.do.co/c/c8d2cb189d36) is a good choice, but Botkit runs in Azure, AWS, Heroku and others.

Get your process up and running on some port - 3000 by default.

Set up letsencrypt or some other SSL solution. Most messaging platforms now require that your endpoint be served over SSL.

Set up nginx to serve your ssl-enabled website and proxy traffic to the bot application on port 3000.

Voila! You have a ssl-enabled bot.

### Optional next steps:
* Only accept requests over https.
* Block access to port 3000


## related topics

* scaling up with multiple bot processes
* botkit and continuous integration

##Use Botkit with an Express web server
Instead of controller.setupWebserver(), it is possible to use a different web server to manage authentication flows, as well as serving web pages.

Here is an example of [using an Express web server alongside Botkit](https://github.com/mvaragnat/botkit-express-demo).
