#!/bin/sh
# generate main docs
./node_modules/.bin/typedoc --excludePrivate --hideGenerator --name "Botkit Core" --readme none --json build/botkit.json --tsconfig ../botkit/tsconfig.json ../botkit/src/index.ts
./node_modules/.bin/typedoc --excludePrivate --hideGenerator --name "Botkit for Slack" --readme none --json build/slack.json --tsconfig ../botbuilder-adapter-slack/tsconfig.json ../botbuilder-adapter-slack/src/index.ts
./node_modules/.bin/typedoc --excludePrivate --hideGenerator --name "Botkit for Facebook" --readme none --json build/facebook.json --tsconfig ../botbuilder-adapter-facebook/tsconfig.json ../botbuilder-adapter-facebook/src/index.ts
./node_modules/.bin/typedoc --excludePrivate --hideGenerator --name "Botkit for Hangouts" --readme none --json build/hangouts.json --tsconfig ../botbuilder-adapter-hangouts/tsconfig.json ../botbuilder-adapter-hangouts/src/index.ts
./node_modules/.bin/typedoc --excludePrivate --hideGenerator --name "Botkit for Twilio SMS" --readme none --json build/twilio-sms.json --tsconfig ../botbuilder-adapter-twilio-sms/tsconfig.json ../botbuilder-adapter-twilio-sms/src/index.ts
./node_modules/.bin/typedoc --excludePrivate --hideGenerator --name "Botkit for Webex Teams" --readme none --json build/webex.json --tsconfig ../botbuilder-adapter-webex/tsconfig.json ../botbuilder-adapter-webex/src/index.ts
./node_modules/.bin/typedoc --excludePrivate --hideGenerator --name "Botkit for the Web" --readme none --json build/web.json --tsconfig ../botbuilder-adapter-web/tsconfig.json ../botbuilder-adapter-web/src/index.ts
./node_modules/.bin/typedoc --excludePrivate --hideGenerator --name "Botkit CMS Plugin" --readme none --json build/cms.json --tsconfig ../botkit-plugin-cms/tsconfig.json ../botkit-plugin-cms/src/index.ts

node build/parse.js
