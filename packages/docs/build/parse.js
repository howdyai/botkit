const fs = require('fs');
const Handlebars = require('handlebars');
let markup = fs.readFileSync(__dirname + '/template.hbs','utf8');

// get rid of leading whitepsace on every line
markup = markup.replace(/^ +/img,'');
const template = Handlebars.compile(markup);

let index = [];
let adapters = [];
let plugins = [];

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
    fs.writeFileSync(dest, toctemplate({index: index, title: 'Class Index'}));
}

function buildAdapters(dest) {

    let toctemplate = Handlebars.compile(fs.readFileSync(__dirname + '/toc-platforms.hbs', 'utf8'));
    console.log(JSON.stringify(index, null, 2));
    fs.writeFileSync(dest, toctemplate({index: adapters, title: 'Platform Adapters'}));
}

function buildPlugins(dest) {

    let toctemplate = Handlebars.compile(fs.readFileSync(__dirname + '/toc.hbs', 'utf8'));
    console.log(JSON.stringify(index, null, 2));
    fs.writeFileSync(dest, toctemplate({index: plugins, title: 'Botkit Plugins'}));
}

function buildIndex(dest) {

    fs.writeFileSync(dest,JSON.stringify({
        reference: index,
        adapters: adapters,
        plugins: plugins
    }, null, 2));

}


function generateAdapter(src, params, dest) {

    let data = {
        body: fs.readFileSync(src, 'utf8'),
        ...params
    };

    // replace links
    data.body = data.body.replace(/\.\.\/docs\/reference/ig,'../reference');
    data.body = data.body.replace(/\.\.\/docs/ig,'..');

    let adaptertemplate = Handlebars.compile(fs.readFileSync(__dirname + '/adapter.hbs', 'utf8'));

    fs.writeFileSync(dest, adaptertemplate(data));

    adapters.push(
        {
            name: data.name,
            path: dest.replace(/.*?\/(platforms\/.*)/,'$1'),
        }
    );
}


function generatePlugin(src, params, dest) {

    let data = {
        body: fs.readFileSync(src, 'utf8'),
        ...params
    };

    // replace links
    data.body = data.body.replace(/\.\.\/docs\/reference/ig,'../reference');
    data.body = data.body.replace(/\.\.\/docs/ig,'..');

    let adaptertemplate = Handlebars.compile(fs.readFileSync(__dirname + '/plugin.hbs', 'utf8'));

    fs.writeFileSync(dest, adaptertemplate(data));

    plugins.push(
        {
            name: data.name,
            path: dest.replace(/.*?\/(plugins\/.*)/,'$1'),
        }
    );
}

function generateReference(src, dest) {

    let data = require(src);

    let classes = [];

    let interfaces = [];

    for (var m = 0; m < data.children.length; m++) {
        let module = data.children[m];

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

    // first float the botworker class if present to top
    classes = classes.sort(workerAtTop);

    // now float adapter to top.  should result in Adapter, Worker, other classes
    classes = classes.sort(adapterAtTop);

    classes = classes.sort(botkitAtTop);

    // console.log(module.name, module.kindString, module.children.length);
    index.push(
        {
            name: data.name,
            packageName: data.children[0].name,
            path: dest.replace(/.*?\/(reference\/.*)/,'$1'),
            classes: classes,
            interfaces: interfaces
        }
    );

    fs.writeFileSync(dest, template({classes: classes, interfaces: interfaces, packageName: data.children[0].name, name: data.name }));
}

function sortByName(a,b) {
    if(a.name < b.name) { return -1; }
    if(a.name > b.name) { return 1; }
    return 0;
}

function botkitAtTop(a,b) {
    if (a.name.match(/^botkit$/i)) { 
        return -1;
    } else if(b.name.match(/^botkit$/i)) {
        return 1;
    } else {
        return 0;
    }
}


function workerAtTop(a,b) {
    if (a.name.match(/botworker/i)) { 
        return -1;
    } else if(b.name.match(/botworker/i)) {
        return 1;
    } else {
        return 0;
    }
}


function adapterAtTop(a,b) {
    if (a.name.match(/adapter/i)) { 
        return -1;
    } else if(b.name.match(/adapter/i)) {
        return 1;
    } else {
        return 0;
    }
}

generateReference(__dirname + '/botkit.json',__dirname + '/../reference/core.md');
generateReference(__dirname + '/web.json',__dirname + '/../reference/web.md');
generateReference(__dirname + '/webex.json',__dirname + '/../reference/webex.md');
generateReference(__dirname + '/slack.json',__dirname + '/../reference/slack.md');
generateReference(__dirname + '/hangouts.json',__dirname + '/../reference/hangouts.md');
generateReference(__dirname + '/twilio-sms.json',__dirname + '/../reference/twilio-sms.md');
generateReference(__dirname + '/facebook.json',__dirname + '/../reference/facebook.md');
generateReference(__dirname + '/cms.json',__dirname + '/../reference/cms.md');

generateAdapter(__dirname + '/../../botbuilder-adapter-web/readme.md', {name: 'Websocket and Webhooks'} , __dirname + '/../platforms/web.md');
generateAdapter(__dirname + '/../../botbuilder-adapter-webex/readme.md', {name: 'Webex Teams'} , __dirname + '/../platforms/webex.md');
generateAdapter(__dirname + '/../../botbuilder-adapter-slack/readme.md', {name: 'Slack'} , __dirname + '/../platforms/slack.md');
generateAdapter(__dirname + '/../../botbuilder-adapter-hangouts/readme.md', {name: 'Google Hangouts'} , __dirname + '/../platforms/hangouts.md');
generateAdapter(__dirname + '/../../botbuilder-adapter-twilio-sms/readme.md', {name: 'Twilio SMS'} , __dirname + '/../platforms/twilio-sms.md');
generateAdapter(__dirname + '/../../botbuilder-adapter-facebook/readme.md', {name: 'Facebook Messenger'} , __dirname + '/../platforms/facebook.md');

generatePlugin(__dirname + '/../../botkit-plugin-cms/readme.md', {name: 'Botkit CMS Plugin'} , __dirname + '/../plugins/cms.md');


buildTOC(__dirname + '/../reference/index.md');
buildAdapters(__dirname + '/../platforms/index.md');
buildPlugins(__dirname + '/../plugins/index.md');
buildIndex(__dirname + '/../index.json');