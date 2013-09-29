var fs = require('fs');
var os = require('path');
var find = require('./find.js');

function writeFiles(path, buffer, outfile, included) {
	var files;
	
	path = os.normalize(path);
	files = find(path).files;
	
	files.forEach(function(file) {
		var i, code, lines;
		
		if (typeof included[file] === 'undefined') {
			code = fs.readFileSync(file).toString();
			lines = code.split(/\r?\n/);
			
			for (i = 0; i < lines.length; i++) {
				lines[i] = buffer + lines[i];
			}
			lines.push(buffer);
			
			fs.writeSync(outfile, lines.join('\n') + '\n');
			
			included[file] = true;
		}
	});
}

function build(template, output) {
	var content, dir, lines, match, outfile, included = {};
	
	template = os.normalize(template);
	output = output || 'output.js';
	
	dir = os.dirname(template);
	content = fs.readFileSync(template).toString();
	lines = content.split(/\r?\n/);
	
	try { fs.mkdirSync(os.join(dir, 'build')); }
	catch (ex) { }
	
	try { fs.mkdirSync(os.join(dir, 'dist')); }
	catch (ex) { }
	
	outfile = fs.openSync(os.join(dir, 'build', output), 'w');
	
	lines.forEach(function(line) {
		match = /^(\s*)@include\s+['"](\S+)['"]$/.exec(line);
		if (match) {
			writeFiles(match[2], match[1], outfile, included);
		}
		else {
			fs.writeSync(outfile, line + '\n');
		}
	});
	
	fs.closeSync(outfile);
}

module.exports = build;