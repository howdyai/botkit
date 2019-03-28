var Generator = require('yeoman-generator');

const platforms = [
    'botframework',
    'slack',
    'hangouts',
    'twilio-sms',
    'webex',
    'websocket',
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
            }
        ]);

        this.answers.safe_name = this.answers.name.toLowerCase().replace(/\s+/,'-');

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

        this.fs.copy(
            this.templatePath('features'),
            this.destinationPath('features')
        );
    }

    install() {
        this.npmInstall();
    }

};