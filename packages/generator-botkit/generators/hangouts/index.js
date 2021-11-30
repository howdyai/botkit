/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

 var Generator = require('yeoman-generator');
 var _ = require('underscore');
 _.extend(Generator.prototype, require('yeoman-generator/lib/actions/install'));

module.exports = class extends Generator {

    async prompting() {

        this.platform = await this.prompt([
            {
                type: "input",
                name: "creds",
                message: "JSON credentials",
            },
            {
                type: "input",
                name: "token",
                message: "Token",
            },
        ]);

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
        this.npmInstall(['botbuilder-adapter-hangouts@latest']);
    }

};