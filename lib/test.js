var assert = require('assert');

function Test() {
	this.pass = 0;
	this.fail = 0;
}

Test.prototype = {
	time: function(fn) {
		var result, start;
		
		console.log(fn);
		
		start = new Date();
		result = fn();
		
		console.log(new Date() - start + 'ms')
	},
	
	assert: function(cond, message) {
		if (cond) {
			this.pass++;
		}
		else {
			this.fail++;
			console.log(message);
		}
	}
};

module.exports = new Test();