"use strict";

let RiveScript = require("riveScript");

var bot = new RiveScript();
let path = require("path");

console.log("loading SimpleBot bot");

// Load a directory full of RiveScript documents (.rive files). This is for
// Node.JS only: it doesn't work on the web!
const brainsDir = path.join(__dirname, "simplebot");

bot.loadDirectory(brainsDir, loading_done, loading_error);

// Load an individual file.
// bot.loadFile("brain/testsuite.rive", loading_done, loading_error);

// Load a list of files all at once (the best alternative to loadDirectory
// for the web!)
// bot.loadFile([
//     "brain/begin.rive",
//     "brain/admin.rive",
//     "brain/clients.rive"
// ], loading_done, loading_error);

// All file loading operations are asynchronous, so you need handlers
// to catch when they've finished. If you use loadDirectory (or loadFile
// with multiple file names), the success function is called only when ALL
// the files have finished loading.
function loading_done (batch_num) {
    console.log("Batch #" + batch_num + " has finished loading!");

    // Now the replies must be sorted!
    bot.sortReplies();

    // And now we're free to get a reply from the brain!
    var reply = bot.reply("local-user", "status");
    console.log("ribot status: " + reply);
}

// It's good to catch errors too!
function loading_error (batch_num, error) {
    console.log("Error when loading files: " + error);
}

module.exports = bot;
