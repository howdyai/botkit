const fs = require('fs');
const Handlebars = require('handlebars');
let markup = fs.readFileSync(__dirname + '/template.hbs','utf8');

// get rid of leading whitepsace on every line
markup = markup.replace(/^ +/img,'');
const template = Handlebars.compile(markup);

let index = [];

Handlebars.registerHelper('no-newline', function(str) {
    if (str) {
        return new Handlebars.SafeString(
            str.replace(/\n/g,'<br/>')
        );
    } else { 
        return '';
    }
});

function buildTOC(dest) {

    let toctemplate = Handlebars.compile(fs.readFileSync(__dirname + '/toc.hbs', 'utf8'));
    console.log(JSON.stringify(index, null, 2));
    fs.writeFileSync(dest, toctemplate({index: index}));
}

function generateReference(src, dest) {

    let data = require(src);

    let classes = [];

    let interfaces = [];

    for (var m = 0; m < data.children.length; m++) {
        let module = data.children[m];
        // console.log(module.name, module.kindString, module.children.length);
        index.push(
            {
                name: data.name,
                path: dest.replace(/.*?\/(reference\/.*)/,'$1')                
            }
        );

        // find the classes
        for (var c = 0; c < module.children.length; c++) {
            let aclass = module.children[c];
            if (aclass.kindString === 'Class') {
                // console.log('>',aclass.name, aclass.kindString);
                if (aclass.children) {
                    aclass.props = aclass.children.filter((c) => { return c.kindString === 'Property' });
                    aclass.props = [...aclass.props, ...aclass.children.filter((c) => { return c.kindString === 'Accessor' })];

                    // controller.middleware is an object literal
                    // aclass.props = [...aclass.props, ...aclass.children.filter((c) => { return c.kindString === 'Object literal' })];

                    aclass.methods = aclass.children.filter((c) => { return c.kindString === 'Method' });
                    aclass.constructors = aclass.children.filter((c) => { return c.kindString === 'Constructor' });
                }
                classes.push(aclass);
            } else if (aclass.kindString === 'Interface') {
                if (aclass.children) {
                    aclass.props = aclass.children.filter((c) => { return c.kindString === 'Property' });
                }
                interfaces.push(aclass);
            }
        }
    }

    classes = classes.sort(sortByName);
    interfaces = interfaces.sort(sortByName);

    fs.writeFileSync(dest, template({classes: classes, interfaces: interfaces, name: data.name}));
}

function sortByName(a,b) {
    if(a.name < b.name) { return -1; }
    if(a.name > b.name) { return 1; }
    return 0;
}

generateReference(__dirname + '/botkit.json',__dirname + '/../reference/core.md');
generateReference(__dirname + '/slack.json',__dirname + '/../reference/slack.md');
generateReference(__dirname + '/facebook.json',__dirname + '/../reference/facebook.md');
generateReference(__dirname + '/hangouts.json',__dirname + '/../reference/hangouts.md');
generateReference(__dirname + '/twilio-sms.json',__dirname + '/../reference/twilio-sms.md');
generateReference(__dirname + '/webex.json',__dirname + '/../reference/webex.md');
generateReference(__dirname + '/websocket.json',__dirname + '/../reference/websocket.md');

buildTOC(__dirname + '/../reference/index.md');