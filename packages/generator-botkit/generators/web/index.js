var Generator = require('yeoman-generator');

module.exports = class extends Generator {

    async prompting() {

        this.platform = await this.prompt([
        ]);

    }

    writing() {

        this.fs.copy(
            this.templatePath('features'),
            this.destinationPath('features')
        );

        this.fs.copy(
            this.templatePath('public'),
            this.destinationPath('public')
        );

        this.fs.copy(
            this.templatePath('sass'),
            this.destinationPath('sass')
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
        this.npmInstall(['botbuilder-adapter-web']);

        // TODO: Install sass?
        // TODO: Add build step to package.json
        // TODO: Add public folder definition in bot.js and/or in a skill somewhere
        
    }

};