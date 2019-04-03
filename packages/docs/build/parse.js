// ../../../node_modules/.bin/typedoc --theme markdown --excludePrivate  --ignoreCompilerErrors --module amd --hideGenerator --name "Botkit" --readme none --entryPoint botkit ../src/index.ts --json ../docs/data.json

const fs = require('fs');
const Handlebars = require('handlebars');
let markup = fs.readFileSync('template.hbs','utf8');

// get rid of leading whitepsace on every line
markup = markup.replace(/^ +/img,'');
const template = Handlebars.compile(markup);


function generateReference(src, dest) {

    let data = require(src);

    let classes = [];

    let interfaces = [];

    for (var m = 0; m < data.children.length; m++) {
        let module = data.children[m];
        console.log(module.name, module.kindString, module.children.length);

        // find the classes
        for (var c = 0; c < module.children.length; c++) {
            let aclass = module.children[c];
            if (aclass.kindString === 'Class') {
                console.log('>',aclass.name, aclass.kindString);
                aclass.props = aclass.children.filter((c) => { return c.kindString === 'Property' });
                aclass.props = [...aclass.props, ...aclass.children.filter((c) => { return c.kindString === 'Accessor' })];

                // controller.middleware is an object literal
                // aclass.props = [...aclass.props, ...aclass.children.filter((c) => { return c.kindString === 'Object literal' })];

                aclass.methods = aclass.children.filter((c) => { return c.kindString === 'Method' });
                aclass.constructors = aclass.children.filter((c) => { return c.kindString === 'Constructor' });

                classes.push(aclass);
            } else if (aclass.kindString === 'Interface') {
                aclass.props = aclass.children.filter((c) => { return c.kindString === 'Property' });
                interfaces.push(aclass);
            }
        }
    }

    classes = classes.sort((a, b) => { return a.name > b.name });
    interfaces = interfaces.sort((a, b) => { return a.name > b.name });

    fs.writeFileSync(dest, template({classes: classes, interfaces: interfaces}).replace(/\n/g,"\r\n"));
}

generateReference('./botkit.json','../reference/core.md');
generateReference('./slack.json','../reference/slack.md');