function debounce(fn, delay) {
	var timeout, that = this;

	return function() {
		var args = arguments;
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			fn.apply(that, args);
		}, delay);
	};
}

module.exports = {
	debounce: debounce
};
