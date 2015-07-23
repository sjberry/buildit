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


/**
 * Placeholder.
 *
 * @param {String} resolved
 * @param {String} [cwd]
 * @returns {String}
 */
function pubname(resolved, cwd) {
	var extension, pubname, relpath;

	cwd = cwd || process.cwd();

	relpath = path.relative(cwd, resolved);
	extension = path.extname(relpath, '.js');
	pubname = extension ? relpath.slice(0, relpath.lastIndexOf(extension)) : relpath;

	return pubname;
}


module.exports = pubname;
