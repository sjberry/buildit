#!/usr/bin/env node
var cmdroute = require('cmdroute')(require('../package.json'), __dirname);


if (require.main === module) {
	var args;

	if (process.argv.length < 3) {
		cmdroute.help();
		process.exit(0);
	}

	try {
		cmdroute.exec.call(this, process.argv);
	}
	catch(e) {
		util.puts(e);
	}
}
