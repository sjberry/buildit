var fs = require('fs');
var os = require('path');

module.exports = function find(path, pattern) {
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
	
	console.log(pattern);
	
	pattern = new RegExp(pattern);
	
	walk(path, files, dirs, pattern);
	
	return {
		files: files,
		dirs: dirs
	};
};

function walk(path, files, dirs, pattern) {
	var i, names;
	
	if (fs.statSync(path).isDirectory()) {
		dirs.push(path);
		
		names = fs.readdirSync(path);
		for (i = 0; i < names.length; i++) {
			walk(os.join(path, names[i]), files, dirs, pattern)
		}
	}
	else {
		if (pattern.test(path)) {
			files.push(path);
		}
	}
}