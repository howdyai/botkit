#!/usr/bin/env node

/******************************************************************************
 * Interactive RiveScript Shell for quickly testing your RiveScript bot.      *
 *                                                                            *
 * Usage: node shell.js /path/to/brain                                        *
 ******************************************************************************/

var readline = require("readline"),
	RiveScript = require("./lib/rivescript");

//------------------------------------------------------------------------------
// Accept command line parameters.
//------------------------------------------------------------------------------

if (process.argv.length < 3) {
	console.log("Usage: node shell.js </path/to/brain>");
	process.exit(1);
}

var brain = process.argv[2];

//------------------------------------------------------------------------------
// Initialize the RiveScript bot and print the welcome banner.
//------------------------------------------------------------------------------

var bot;
var loadBrain = function(doneFunc) {
  console.log("reloading", brain);
  bot = new RiveScript();  // load/replace
  bot.loadDirectory(brain, loading_done);
}

loadBrain(runBot);
runBot();

function loading_done(batch_num) {
	bot.sortReplies();

	console.log("RiveScript Interpreter (JavaScript) -- Interactive Mode");
	console.log("-------------------------------------------------------");
	console.log("rivescript version: " + bot.version());
	console.log("        Reply root: " + brain);
	console.log("");
	console.log(
		"You are now chatting with the RiveScript bot. Type a message and press Return\n"
		+ "to send it. When finished, type '/quit' to exit the program.\n"
		+ "Type '/help' for other options.\n"
	);

	//--------------------------------------------------------------------------
	// Drop into the interactive command shell.
	//--------------------------------------------------------------------------
}

function runBot() {
	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	rl.setPrompt("You> ");
	rl.prompt();
	rl.on("line", function(cmd) {
		// Handle commands.
		if (cmd === "/help") {
			help();
		} else if (cmd.indexOf("/eval ") === 0) {
			eval(cmd.replace("/eval ", ""));
		} else if (cmd.indexOf("/log ") === 0) {
			console.log(eval(cmd.replace("/log ", "")));
    } else if (cmd === "/r" || cmd ==="/reload") {
      console.log("reloading");
      loadBrain(null);
		} else if (cmd === "/quit") {
			process.exit(0);
		} else {
			// Get a reply from the bot.
			var reply = bot.reply("localuser", cmd);
			console.log("Bot>", reply);
		}

		rl.prompt();
	}).on("close", function() {
		process.exit(0);
	});

}

function help() {
	console.log("Supported commands:");
	console.log("/help        : Show this text.");
	console.log("/eval <code> : Evaluate JavaScript code.");
	console.log("/log <code>  : Shortcut to /eval console.log(code).");
	console.log("/quit        : Exit the program.");
}
