/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var Generator = require('yeoman-generator');
var _ = require('underscore');
_.extend(Generator.prototype, require('yeoman-generator/lib/actions/install'));

module.exports = class extends Generator {

    async prompting() {

        var type = await this.prompt([
            {
                type: "input",
                name: "clientSigningSecret",
                message: "Client signing secret (from api.slack.com)",
            },
            {
                type: "list",
                name: "type",
                choices: ['single','multi'],
                message: "Configure for single-team or multi-team?",
            }
        ]);

        if (type.type == 'single') {
            this.platform = await this.prompt([
                {
                    type: "input",
                    name: "botToken",
                    message: "Bot Token",
                },
            ]);
        } else {
            this.platform = await this.prompt([
                {
                    type: "input",
                    name: "clientId",
                    message: "Client ID",
                },
                {
                    type: "input",
                    name: "clientSecret",
                    message: "Client Secret",
                },
                {
                    type: "input",
                    name: "redirectUri",
                    message: "OAuth Redirect URI (in the form https://<myhost.com>/install/auth)",
                },
            ]);
        }

        this.platform.type = type.type;
        this.platform.clientSigningSecret = type.clientSigningSecret;
    }

    writing() {

        this.fs.copy(
            this.templatePath('features'),
            this.destinationPath('features')
        );

        this.fs.copyTpl(
            this.templatePath('.env'),
            this.destinationPath('.env'),
            { 
                platform: this.platform,
                options: this.options,
            },
        );

    }

    install() {
        this.npmInstall(['botbuilder-adapter-slack@latest']);
    }

};