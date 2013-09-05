var fs = require('fs');
var os = require('path');

/**
 * Used by `.find()` to traverse a given directory structure.
 * @private
 * @param {string} path The immediate path to search to scan for sub-directories, files, or file matches.
 * @param {Array} files An array of files passed by reference. Any discovered files matching the specified pattern are appended.
 * @param {Array} dirs An array of directories passed by reference. Any discovered directories found beneath the original path are appended.
 * @param {RegExp} pattern A pattern that discovered files must match in order to be appended to the index array.
 */
function walk(path, files, dirs, pattern) {
	var i, names;
	
	if (fs.statSync(path).isDirectory()) {
		dirs.push(path);
		
		names = fs.readdirSync(path);
		for (i = 0; i < names.length; i++) {
			walk(os.join(path, names[i]), files, dirs, pattern)
		}
	}
	else if (pattern.test(path)) {
		files.push(path);
	}
}

/**
 * 
 *
 */
function find(path, pattern) {
	var i, files = [], dirs = [], re_extension;
	
	path = os.normalize(path);
	
	if (typeof pattern === 'undefined') {
		pattern = '*';
	}
	
	if (pattern.charAt(0) !== '*') {
		pattern = '^' + pattern;
	}
	
	if (pattern.charAt(pattern.length - 1) !== '*') {
		pattern = pattern + '$';
	}
	
	pattern = pattern.replace(/[\.\*]/g, function(ch) {
		switch (ch) {
			case '.':
				return '\\.';
			case '*':
				return '.*';
		}
	});
	
	pattern = new RegExp(pattern);
	
	walk(path, files, dirs, pattern);
	
	return {
		files: files,
		dirs: dirs
	};
}

module.exports = find;