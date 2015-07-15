/**
 * @license
 * Copyright (C) 2015 Steven Berry (http://www.sberry.me/buildit)
 * Licensed: MIT (http://opensource.org/licenses/mit-license.php)
 *
 * Steven Berry
 * www.sberry.me
 * steven@sberry.me
 */


var fs = require('fs');
var path = require('path');

var detective = require('detective');
var foreach = require('foreach');
var glob = require('glob');
var unique = require('mu-unique');

var pubname = require('./pubname');


var cache = {};


/**
 * Placeholder.
 *
 * @param from
 * @param to
 * @constructor
 */
function File(from, to) {
	var cached, dirname, external, local, source, resolved;

	resolved = _resolve(from, to);

	if (cached = cache[resolved]) {
		return cached;
	}

	if (!fs.existsSync(resolved)) {
		throw new Error('File "' + resolved + '" not found');
	}

	this.path = resolved;

	dirname = path.dirname(resolved);
	local = this.local = {};
	external = this.external = [];
	source = this.source = fs.readFileSync(resolved);

	foreach(detective(source), function(to) {
		if (~to.indexOf('/')) {
			local[to] = _resolve(dirname, to)
		}
		else {
			external.push(to);
		}
	});

	cache[resolved] = this;
}


/**
 * Placeholder.
 *
 * @param {Array} files
 * @returns {Object}
 */
var _flatten = (function() {
	function helper(batch, file) {
		if (!batch.hasOwnProperty(file.path)) {
			batch[file.path] = file;

			foreach(file.local, function(fullname) {
				helper(batch, new File(fullname));
			});
		}
	}

	return function _flatten(files) {
		var batch;

		batch = {};

		foreach(files, function(file) {
			helper(batch, file);
		});

		return batch;
	}
})();


/**
 * Placeholder.
 *
 * @param from
 * @param to
 * @returns {String}
 * @private
 */
function _resolve(from, to) {
	if (typeof to === 'undefined') {
		to = from;
		from = void(0);
	}

	if (!path.extname(to)) {
		to += '.js';
	}

	return (typeof from === 'undefined') ? path.resolve(to) : path.resolve(from, to);
}


/**
 * Placholder.
 *
 * @param {String|Array} patterns
 * @param {String} cwd
 * @returns {Object}
 */
function walk(patterns, cwd) {
	var externals, files, pubfiles;

	if (typeof patterns === 'undefined') {
		return [];
	}

	patterns = (patterns instanceof Array) ? patterns : [patterns];
	cwd = cwd || process.cwd();

	externals = [];
	files = {};
	pubfiles = {};

	foreach(patterns, function(pattern) {
		var globbed;

		globbed = glob.sync(pattern, {
			cwd: cwd
		});

		globbed.forEach(function(filename) {
			var file;

			file = new File(cwd, filename);
			files[file.path] = file;
		});
	});

	foreach(_flatten(files), function(file, path) {
		Array.prototype.push.apply(externals, file.external);
		pubfiles[pubname(path, cwd)] = file;
	});

	unique(externals);

	return {
		externals: externals,
		locals: pubfiles
	};
}


module.exports = walk;
