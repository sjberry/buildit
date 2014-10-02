var fs = require('fs');
var os = require('path');
var vm = require('vm');
var find = require('./find.js');
var logger = require('./logger.js');
var util = require('./util.js');

// Internal variables
var modules = {};
var vars = {};
var encoding = undefined;
var window = this.window = this;

function importFile(file) {
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
			fs.watch(file, util.debounce(function(e, name) {
				if (e == 'change') {
					logger.info('Reloading changed file "' + file + '"');
					importFile(file);
				}
			}, 750));
		}

		modules[file] = true;
	}
	catch (ex) {
		logger.error('"' + file + '" -- ' + ex.toString());
	}
}

function load(path, refresh) {
	var i, file, files;

	path = os.normalize(path);
	refresh = (refresh === true) ? refresh : false;
	files = find(path).files;

	for (i = 0; i < files.length; i++) {
		file = files[i];

		if (refresh || !modules[file]) {
			importFile(file);
		}
	}
}

//load.modules = modules;
load.vars = vars;

module.exports = load;
