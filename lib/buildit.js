var foreach = require('foreach');
var unique = require('mu-unique');

var invert = require('./invert');
var print = require('./print');
var walk = require('./walk');


/**
 * Placeholder.
 *
 * @param patterns
 * @param opts
 * @constructor
 */
function Buildit(patterns, opts) {
	if (typeof patterns === 'object') {
		opts = patterns;
		patterns = void(0);
	}

	opts = opts || {};

	this.cwd = opts.baseUrl || process.cwd();
	this.define = invert(opts.define || {});
	this.exports = opts.exports || {};
	this.name = opts.name;
	this.locals = {};
	this.externals = [];

	if (patterns) {
		this.add(patterns);
	}
}

Buildit.prototype = {
	/**
	 * Placeholder.
	 *
	 * @param pattern
	 */
	add: function Buildit$add(pattern) {
		var externals, locals, walked;

		externals = this.externals;
		locals = this.locals;

		walked = walk(pattern, this.cwd);

		Array.prototype.push.apply(externals, walked.externals);
		unique(externals);

		foreach(walked.locals, function(file, name) {
			locals[name] = file;
		});

		return this;
	},

	bundle: function Buildit$bundle() {
		// TODO: Make this compatible with gulp streams.
	},

	/**
	 * Placeholder.
	 *
	 * @returns {string}
	 */
	run: function Buildit$run() {
		var cwd, define, exports, externals, locals, name, out;

		cwd = this.cwd;
		define = this.define;
		exports = this.exports;
		externals = this.externals;
		locals = this.locals;
		name = this.name;

		foreach(define, function(name, path) {
			if (!locals.hasOwnProperty(path)) {
				throw new Error('Module "' + path + '" not found');
			}
		});

		foreach(exports, function(path, name) {
			if (!locals.hasOwnProperty(path)) {
				throw new Error('Module "' + path + '" not found');
			}
		});

		out = '';
		out += print.header(name, externals);
		out += print.library(externals);
		out += print.mappings(locals, cwd);
		out += print.machinery();

		foreach(locals, function(file, name) {
			out += print.file(name, file.source) + (define[name] ? print.define(define[name], name) : '');
		});

		out += print.exports(exports);
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
function buildit(patterns, opts) {
	return new Buildit(patterns, opts).run();
}


buildit.Buildit = Buildit;

module.exports = buildit;
