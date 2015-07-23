/**
 * @license
 * Copyright (C) 2015 Steven Berry (http://www.sberry.me/buildit)
 * Licensed: MIT (http://opensource.org/licenses/mit-license.php)
 *
 * Steven Berry
 * www.sberry.me
 * steven@sberry.me
 */

var path = require('path');

var unique = require('mu-unique');

var each = require('../lib/each');
var invert = require('../lib/invert');
var print = require('../lib/print');
var walk = require('../lib/walk');


/**
 * Placeholder.
 *
 * @param patterns
 * @param opts
 * @constructor
 */
function Buildit(opts) {
	opts = opts || {};

	this.cwd = opts.baseUrl || process.cwd();
	this.name = opts.name;
	this.locals = {};
	this.externals = [];

	if (opts.define) {
		this.define = opts.define;
	}

	if (opts.exports) {
		this.exports = opts.exports;
	}
}

Buildit.prototype = {
	define: {},
	exports: {},

	bundle: function Buildit$bundle() {
		// TODO: Make this compatible with gulp streams.
	},

	/**
	 * Placeholder.
	 *
	 * @returns {string}
	 */
	run: function Buildit$run() {
		var externals, locals, define, out, patterns, walked, that = this;

		define = invert(this.define);
		externals = [];
		locals = {};
		patterns = [];

		each(this.exports, function(filepath, name) {
			var fullpath;

			fullpath = path.join(that.cwd, filepath + '.js');

			patterns.push(fullpath);
		});

		each(this.define, function(filepath, name) {
			var fullpath;

			fullpath = path.join(that.cwd, filepath + '.js');

			patterns.push(fullpath);
		});

		walked = walk(patterns, this.cwd);

		Array.prototype.push.apply(externals, walked.externals);
		unique(externals);

		each(walked.locals, function(file, name) {
			locals[name] = file;
		});

		each(this.define, function(filepath, name) {
			if (!locals.hasOwnProperty(filepath)) {
				throw new Error('Module "' + filepath + '" not found');
			}
		});

		each(this.exports, function(filepath, name) {
			if (!locals.hasOwnProperty(filepath)) {
				throw new Error('Module "' + filepath + '" not found');
			}
		});

		out = '';
		out += print.header(this.name, externals);
		out += print.library(externals);
		out += print.mappings(locals, this.cwd);
		out += print.machinery();

		each(locals, function(file, name) {
			out += print.file(name, file.source) + (define[name] ? print.define(define[name], name) : '');
		});

		out += print.exports(this.exports);
		out += print.footer();

		return out;
	}
};


/**
 * Placeholder.
 *
 * @param patterns
 * @param opts
 * @returns {String}
 */
function buildit(opts) {
	return new Buildit(opts).run();
}


buildit.Buildit = Buildit;

module.exports = buildit;
