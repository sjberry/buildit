#!/usr/bin/env node
var optimist = require('optimist');
var sys = require("util");
var build = require('../lib/build.js');

var argv = optimist
	.usage('$0 [input1.js] [options]\n')
	.describe('t', 'Template file required only if input file isn\'t otherwise specified.')
	.describe('o', 'Output file (default `./build/output.js`).')
	.describe('v', 'Print version number and exit.')
	.alias('t', 'template')
	.alias('o', 'output')
	.alias('v', 'version')
	.wrap(80)
	.argv;

if (argv.version || argv.v) {
	var json = require('../package.json');
	sys.puts(json.name + ' ' + json.version);
	process.exit(0);
}

if (argv.help || argv.h) {
	sys.puts('\n' + optimist.help());
	process.exit(0);
}

var template = argv._[0] || argv.template || argv.t;
var output = argv.output || argv.o || 'output.js';

if (!template) {
	sys.puts('\nNo input template specified.');
	process.exit(0);
}

build(template, output);