/**
 * @license
 * Copyright (C) 2015 Steven Berry (http://www.sberry.me/buildit)
 * Licensed: MIT (http://opensource.org/licenses/mit-license.php)
 *
 * Steven Berry
 * www.sberry.me
 * steven@sberry.me
 */

var foreach = require('foreach');


function each(obj, callback) {
	if (typeof obj !== 'object') {
		callback(obj);
	}
	else {
		foreach(obj, callback);
	}
}


module.exports = each;
