#!/bin/sh
# generate main docs
../../../node_modules/.bin/typedoc --theme markdown --excludePrivate  --ignoreCompilerErrors --module amd --hideGenerator --name "Botkit" --readme none --entryPoint botkit ../../botkit/src/index.ts --json botkit.json
../../../node_modules/.bin/typedoc --theme markdown --excludePrivate  --ignoreCompilerErrors --module amd --hideGenerator --name "Botkit for Slack" --readme none --entryPoint "botbuilder-adapter-slack" ../../botbuilder-adapter-slack/src/index.ts --json slack.json
node parse.js