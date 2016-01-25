/* global bot */

'use strict';

var RiveScript = require('riveScript');
var path = require('path');
var BotLoader = {};

// Load a directory full of RiveScript documents (.rive files)
var brainsDir = path.join(__dirname, 'scripts');

function log(msg) {
  console.log(msg);
}

BotLoader.reset = function() {
    log('loading rivescripts brain');
    BotLoader.brain = new RiveScript();
    BotLoader.brain.loadDirectory(brainsDir, loading_done, loading_error);
};

// Load an individual file.
// brain.loadFile('brain/testsuite.rive', loading_done, loading_error);

// Load a list of files all at once (the best alternative to loadDirectory
// for the web!)
// brain.loadFile([
//     'brain/begin.rive',
//     'brain/admin.rive',
//     'brain/clients.rive'
// ], loading_done, loading_error);

// All file loading operations are asynchronous, so you need handlers
// to catch when they've finished. If you use loadDirectory (or loadFile
// with multiple file names), the success function is called only when ALL
// the files have finished loading.
function loading_done(batch_num) {
    log('Batch #' + batch_num + ' has finished loading!');

    // Now the replies must be sorted!
    BotLoader.brain.sortReplies();

    // And now we're free to get a reply from the brain!
    var reply = BotLoader.brain.reply('local-user', 'status');
    log('ribrain status: ' + reply);
}

// It's good to catch errors too!
function loading_error(batch_num, error) {
    log('Error when loading files: ' + error);
}

BotLoader.reset();
module.exports = BotLoader;
