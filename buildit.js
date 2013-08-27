var fs = require('fs');
var os = require('path');
var vm = require('vm');
var find = require('./lib/find.js');
var logger = require('./lib/logger.js');


// Internal variables
var modules = {};
var vars = {};
var encoding = undefined;
var window = this.window = this;


// Private util functions
function _debounce(fn, delay) {
	var timeout, that = this;
	
	return function() {
		var args = arguments;
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			fn.apply(that, args);
		}, delay);
	};
};

function _include(path, buffer, outfile, included) {
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

function _load(file) {
	var code, context, prop;
	
	code = fs.readFileSync(file, encoding).toString();
	context = {
		window: window
	};
	
	try {
		vm.runInNewContext(code, context);
		
		for (prop in context) {
			if (context[prop] !== window) {
				if (typeof vars[prop] !== 'undefined' && vars[prop] !== file) {
					logger.warn('`' + prop + '` from "' + vars[prop] + '" overwritten by including "' + file + '"');
					modules[vars[prop]] = false;
				}
				
				vars[prop] = file;
			}
		}
		
		this.window = this;
		vm.runInThisContext(code, this);
		
		if (typeof modules[file] === 'undefined') {
			fs.watch(file, debounce(function(e, name) {
				if (e == 'change') {
					logger.info('Reloading changed file "' + file + '"');
					_load(file);
				}
			}, 750));
		}
		
		modules[file] = true;
	}
	catch (ex) {
		logger.error('"' + file + '" -- ' + ex.toString());
	}
}


// Export functions
function load(path, refresh) {
	var i, file, files;
	
	path = os.normalize(path);
	refresh = (refresh === true) ? refresh : false;
	files = find(path).files;
	
	for (i = 0; i < files.length; i++) {
		file = files[i];
		
		if (refresh || !modules[file]) {
			_load(file);
		}
	}
};

function concat(template, output) {
	var content, dir, lines, match, outfile, included = {};
	
	template = os.normalize(template);
	output = (typeof output === 'undefined') ? 'output.js' : output;
	dir = os.dirname(template);
	content = fs.readFileSync(template).toString();
	lines = content.split(/\r?\n/);
	
	try {
		fs.mkdirSync(os.join(dir, 'build'));
	}
	catch (ex) { }
	
	try {
		fs.mkdirSync(os.join(dir, 'dist'));
	}
	catch (ex) { }
	
	outfile = fs.openSync(os.join(dir, 'build', output), 'w');
	
	lines.forEach(function(line) {
		match = /^(\s*)@include\s+['"](\S+)['"]$/.exec(line);
		if (match) {
			_include(match[2], match[1], outfile, included);
		}
		else {
			fs.writeSync(outfile, line + '\n');
		}
	});
	
	fs.closeSync(outfile);
};


// Publish public variables
module.exports = {
	modules: modules,
	vars: vars,
	
	concat: concat,
	load: load
};