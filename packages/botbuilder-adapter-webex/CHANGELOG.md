# botbuilder-adapter-webex changelog

# 1.0.1

* 1:1 messages between bot and user will now emit `direct_message` events instead of `message` events
* Messages will now have `orgId`, `appId` and `actorId` fields
* Add `enable_incomplete` option to allow adapter to start without a complete config.

# 1.0.0 

First release