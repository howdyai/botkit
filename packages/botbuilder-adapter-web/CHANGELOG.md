# botbuilder-adapter-web changelog

# 1.0.4

* Update dependencies (Bot Framework to 4.5.2, Botkit to 4.5, WS to 7.1.1)

# 1.0.3

* Fix - will not attempt to send a message if socket is closed. - Thanks [@naktibalda](https://github.com/Naktibalda) for [the fix](https://github.com/howdyai/botkit/pull/1657)
* Add getConnection method() - Thanks to [@naktibalda](https://github.com/Naktibalda) for [the contribution](https://github.com/howdyai/botkit/pull/1666)

# 1.0.2

* Add [isConnected()](https://botkit.ai/docs/v4/reference/web.html#isconnected) method to WebAdapter. This allows a bot to check the status of a (potentially stale) websocket connection before sending messages. Thanks to [@Naktibalda](https://github.com/Naktibalda) for [this contribution](https://github.com/howdyai/botkit/pull/1644).

# 1.0.1

This was the first public release!