# Botkit Message Processing Pipeline


## ingest

Ingestion into Botkit is the first step in the pipeline process.

Before this middleware fires, the `original_message` field will be set with the full,
raw content of the original incoming payload from the messaging service.

The ingestion phase is useful for actions like:

* Validating the origin of the incoming payload using a shared secret or encrypted header
* Sending necessary response to incoming webhooks

## normalize

Make sure the message object conforms to Botkit's basic assumptions:

there will be a type field, a user field, a channel field, and, if user text is included, a text field.

if not already set by the platform, the type field will be set to 'message_received'

## categorize

Evaluate the message and change its type.

For example, identify direct messages, mentions, self messages, and other more specialized types of message.


## receive

Receive the message and attach it to a conversation if one exists.

Otherwise, trigger an event based on the `message.type` field, which will then
make it possible for the message to trigger specific events or be heard.

## triggered

This middleware happens before any an 'on' event is fired.

## heard

This middleware happens before any 'hears' event is fired.

## capture

This middleware happens when a convo.ask captures a response from a user

## send

This middleware happens before every message is sent.
