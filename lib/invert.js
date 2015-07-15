/**
 * @license
 * Copyright (C) 2015 Steven Berry (http://www.sberry.me/buildit)
 * Licensed: MIT (http://opensource.org/licenses/mit-license.php)
 *
 * Steven Berry
 * www.sberry.me
 * steven@sberry.me
 */


function invert(obj) {
	var key, flipped;

	flipped = {};

	for (key in obj) {
		if (!obj.hasOwnProperty(key)) {
			break;
		}

		flipped[obj[key]] = key;
	}

	return flipped;
}


module.exports = invert;
