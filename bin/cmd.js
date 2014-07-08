#!/usr/bin/env node
var path = require('path');
var util = require('util');

var optionator = require('optionator');


var argParser = optionator({
	prepend: 'Usage: buildit [command] [options]',
	options: [
		{
			option: 'help',
			alias: 'h',
			type: 'Boolean',
			description: 'Displays help'
		},
		{
			option: 'version',
			alias: 'v',
			type: 'Boolean',
			description: 'Displays version'
		}
	]
});


function main(argv) {
	var args, cmd, command, filename, manifest, resolved, result;

	argv = argv.slice();

	if (argv[2] && argv[2].charAt(0) !== '-') {
		cmd = argv.splice(2, 1)[0];
	}

	if (!cmd) {
		args = argParser.parse(argv);

		if (args.help) {
			util.puts(argParser.generateHelp());
			process.exit(0);
		}

		if (args.version) {
			manifest = require('../package.json');
			util.puts(manifest.name + ' ' + manifest.version);
			process.exit(0);
		}
	}

	filename = path.join(__dirname, 'commands', cmd) + '.js';
	resolved = path.resolve(filename);
	command = require(resolved);
	result = command.main(process.argv);

	if (typeof result === 'string') {
		util.puts(result);
	}

	if (command.persist !== true) {
		process.exit(0);
	}
}


if (require.main === module) {
	var args;

	if (process.argv.length < 3) {
		util.puts(argParser.generateHelp());
		process.exit(0);
	}

	try {
		main.call(this, process.argv);
	}
	catch(e) {
		util.puts(e);
	}
}
