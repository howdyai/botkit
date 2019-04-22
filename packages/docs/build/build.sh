#!/bin/sh
# generate main docs
./node_modules/.bin/typedoc --excludePrivate  --ignoreCompilerErrors --module amd --hideGenerator --name "Botkit Core" --readme none --entryPoint botkit ../botkit/src/index.ts --json build/botkit.json
./node_modules/.bin/typedoc --excludePrivate  --ignoreCompilerErrors --module amd --hideGenerator --name "Botkit for Slack" --readme none --entryPoint "botbuilder-adapter-slack" ../botbuilder-adapter-slack/src/index.ts --json build/slack.json
./node_modules/.bin/typedoc --excludePrivate  --ignoreCompilerErrors --module amd --hideGenerator --name "Botkit for Facebook" --readme none --entryPoint "botbuilder-adapter-facebook" ../botbuilder-adapter-facebook/src/index.ts --json build/facebook.json
./node_modules/.bin/typedoc --excludePrivate  --ignoreCompilerErrors --module amd --hideGenerator --name "Botkit for Hangouts" --readme none --entryPoint "botbuilder-adapter-hangouts" ../botbuilder-adapter-hangouts/src/index.ts --json build/hangouts.json
./node_modules/.bin/typedoc --excludePrivate  --ignoreCompilerErrors --module amd --hideGenerator --name "Botkit for Twilio SMS" --readme none --entryPoint "botbuilder-adapter-twilio-sms" ../botbuilder-adapter-twilio-sms/src/index.ts --json build/twilio-sms.json
./node_modules/.bin/typedoc --excludePrivate  --ignoreCompilerErrors --module amd --hideGenerator --name "Botkit for Webex Teams" --readme none --entryPoint "botbuilder-adapter-webex" ../botbuilder-adapter-webex/src/index.ts --json build/webex.json
./node_modules/.bin/typedoc --excludePrivate  --ignoreCompilerErrors --module amd --hideGenerator --name "Botkit for the Web" --readme none --entryPoint "botbuilder-adapter-web" ../botbuilder-adapter-web/src/index.ts --json build/web.json
./node_modules/.bin/typedoc --excludePrivate  --ignoreCompilerErrors --module amd --hideGenerator --name "Botkit CMS Plugin" --readme none --entryPoint "botkit-plugin-cms" ../botkit-plugin-cms/src/index.ts --json build/cms.json

node build/parse.js
