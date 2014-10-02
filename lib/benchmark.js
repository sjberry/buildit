function Benchmark(ext) {
	if (this instanceof Benchmark) {
		this.tests = {};

		if (typeof ext !== 'undefined') {
			this.add(ext);
		}

		return this;
	}
	else {
		return Benchmark.prototype.exec.apply(this, arguments);
	}
};

Benchmark.prototype = {
	add: function(ext) {
		var key;

		for (key in ext) {
			this.tests[key] = ext[key];
		}

		return this;
	},

	exec: function(name, n) {
		var callback, result, start;

		callback = (typeof name === 'string' && this instanceof Benchmark) ? this.tests[name] : name;

		if (!(callback instanceof Function)) {
			console.warn('Invalid test callback.');
			return false;
		}

		console.log(callback.toString());

		if ((typeof n === 'number') && !isNaN(n) && isFinite(n)) {
			start = new Date();
			for (var i = 0; i < n; i++) {
				callback();
			}
			console.log((new Date() - start) / n + 'ms');
		}
		else {
			start = new Date();
			result = callback();
			console.log(new Date() - start + 'ms');

			return result;
		}
	}
};

module.exports = Benchmark;
