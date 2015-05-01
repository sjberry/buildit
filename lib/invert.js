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
