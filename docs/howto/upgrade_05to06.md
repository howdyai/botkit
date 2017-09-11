# How to upgrade Botkit 0.5 to 0.6

With the introduction of the Botkit Message Pipeline,
a few things changed about the way message events are
emitted that will impact developers - particularly those
who use button callback events on Slack and Facebook,
and those who have built or are using middleware plugins
for Botkit.

Deprecated: Facebook `receive_via_postback` no longer needed.
Can now include `facebook_postback` as an event to hear.

Deprecated: Slack `interactive_replies` no longer needed.
Can now include `interactive_message_callback` as an event to hear.
