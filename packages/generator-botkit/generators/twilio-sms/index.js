var Generator = require('yeoman-generator');

module.exports = class extends Generator {
    async prompting() {

        this.platform = await this.prompt([
            {
                type: "input",
                name: "number",
                message: "Phone Number",
            },
            {
                type: "input",
                name: "account_sid",
                message: "Account SID",
            },
            {
                type: "input",
                name: "auth_token",
                message: "Auth Token",
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
        this.npmInstall(['botbuilder-twilio-sms']);
        this.npmInstall(['twilio']);
    }

};