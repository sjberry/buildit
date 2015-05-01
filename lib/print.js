var fs = require('fs');
var path = require('path');

var foreach = require('foreach');

var pubname = require('./pubname');


function define(name, path) {
	return 'define(\'' + name + '\', [], function() { return require(\'' + path + '\'); });\n';
}


function exports(exports) {
	var modules;

	modules = [];

	foreach(exports, function(path, name) {
		modules.push('\'' + name + '\':require(\'' + path + '\')');
	});

	return 'return {' + modules.join(',') + '};\n';
}


function file(name, source) {
	var out;

	out = '\n';
	out += '_define(\'' + name + '\', function(require, module, exports) {\n';

	out += source + '\n';
	out += '});\n';

	return out;
}


function footer() {
	return '});';
}


function header(name, externals) {
	var header, stringed;

	stringed = externals.map(function(str) {
		return '\'' + str + '\'';
	});

	header = 'define(';

	if (name) {
		header += '\'' + name + '\', ';
	}

	header += '[' + stringed.join(', ') + '], function(' + externals.join(', ') + ') {\n';

	return header;
}


function library(externals) {
	var definitions;

	definitions = externals.map(function(name) {
		return name + ':' + name;
	});

	return 'var cache = {' + definitions.join(',') + '};\n';
}


function machinery() {
	var pathname;

	pathname = path.join(__dirname, '../fragments/machinery.js');

	return fs.readFileSync(pathname);
}

function mappings(files, cwd) {
	var mappings;

	cwd = cwd || process.cwd();

	mappings = [];

	foreach(files, function(file, name) {
		var dirname, lookups;

		dirname = path.dirname(file.path);
		lookups = [];

		foreach(file.local, function(fullname, localname) {
			var lookup, resolved;

			resolved = path.resolve(path.join(dirname, localname));
			lookup = pubname(resolved, cwd);

			lookups.push('\'' + localname + '\':\'' + lookup + '\'');
		});

		if (lookups.length > 0) {
			mappings.push('\'' + name + '\':{' + lookups.join(',') + '}');
		}
	});

	return 'var mappings = {' + mappings.join(',') + '};\n';
}


module.exports = {
	define: define,
	exports: exports,
	file: file,
	footer: footer,
	header: header,
	library: library,
	machinery: machinery,
	mappings: mappings
};
