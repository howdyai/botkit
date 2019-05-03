var Generator = require('yeoman-generator');

module.exports = class extends Generator {
    async prompting() {

        this.platform = await this.prompt([
            {
                type: "input",
                name: "appId",
                message: "App ID",
            },
            {
                type: "input",
                name: "appPassword",
                message: "App Password",
            }
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
        // noop
    }

};