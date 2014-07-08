var fs = require('fs');
var os = require('path');
var util = require('util');

var find = require('./find.js');


function writeFiles(path, indent, included) {
	var files, output = [];

	path = os.normalize(path);
	files = find(path).files;

	files.forEach(function(file) {
		var i, code, lines;

		if (typeof included[file] === 'undefined') {
			code = fs.readFileSync(file).toString();
			lines = code.split(/\r?\n/);

			for (i = 0; i < lines.length; i++) {
				output.push(indent + lines[i]);
			}
			output.push(indent);

			included[file] = true;
		}
	});

	return output;
}


function build(template, output) {
	var content, dir, included, lines, match, outfile, stream;

	template = os.normalize(template);

	dir = os.dirname(template);
	content = fs.readFileSync(template).toString();
	lines = content.split(/\r?\n/);
	stream = [];
	included = {};

	lines.forEach(function(line) {
		match = /^(\s*)@include\s+['"](\S+)['"]$/.exec(line);
		Array.prototype.push.apply(stream, match ? writeFiles(match[2], match[1], included) : [line])
	});

	/*
	outfile = fs.openSync(os.join(dir, 'build', output), 'w');
	fs.writeSync(outfile, stream.join('\n'));
	fs.closeSync(outfile);
	*/

	content = stream.join('\n');

	util.puts(content);
}

module.exports = build;
