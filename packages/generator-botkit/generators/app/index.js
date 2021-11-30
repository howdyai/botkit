/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

var Generator = require('yeoman-generator');
var _ = require('underscore');
_.extend(Generator.prototype, require('yeoman-generator/lib/actions/install'));

var path = require('path');

const platforms = [
    'botframework',
    'slack',
    'hangouts',
    'twilio-sms',
    'webex',
    'web',
    'facebook'
];

module.exports = class extends Generator {

    async prompting() {
        this.answers = await this.prompt([
            {
                type: "input",
                name: "name",
                message: "What is your bot's name?",
                default: this.appname
            },
            {
                type: "list",
                name: "platform",
                choices: platforms,
                message: "Which messaging platform?",
            },
            {
                type: "input",
                name: "mongo_uri",
                message: "(Optional) Mongo URI for state persistence:",
            }
        ]);

        this.answers.safe_name = this.answers.name.toLowerCase().replace(/\s+/,'-');

    }

    async composing() {
        if (this.answers.platform === 'slack') {
            this.composeWith(require.resolve(path.join(__dirname,'..','slack')), this.answers);
        } else if (this.answers.platform === 'hangouts') {
            this.composeWith(require.resolve(path.join(__dirname,'..','hangouts')), this.answers);
        } else if (this.answers.platform === 'facebook') {
            this.composeWith(require.resolve(path.join(__dirname,'..','facebook')), this.answers);
        } else if (this.answers.platform === 'twilio-sms') {
            this.composeWith(require.resolve(path.join(__dirname,'..','twilio-sms')), this.answers);
        } else if (this.answers.platform === 'webex') {
            this.composeWith(require.resolve(path.join(__dirname,'..','webex')), this.answers);
        } else if (this.answers.platform === 'web') {
            this.composeWith(require.resolve(path.join(__dirname,'..','web')), this.answers);
        } else if (this.answers.platform === 'botframework') {
            this.composeWith(require.resolve(path.join(__dirname,'..','botframework')), this.answers);
        }
    }

    writing() {

        this.fs.copyTpl(
            this.templatePath('package.json'),
            this.destinationPath('package.json'),
            this.answers
        );

        this.fs.copyTpl(
            this.templatePath('bot.js'),
            this.destinationPath('bot.js'),
            this.answers
        );

        this.fs.copyTpl(
            this.templatePath('gitignore'),
            this.destinationPath('.gitignore'),
            this.answers
        );

        this.fs.copyTpl(
            this.templatePath('readme.md'),
            this.destinationPath('readme.md'),
            this.answers
        );


        this.fs.copy(
            this.templatePath('features'),
            this.destinationPath('features')
        );
    }

    install() {
        this.npmInstall();
    }

};