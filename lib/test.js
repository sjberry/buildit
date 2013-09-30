// No need for this dependency for now.
// Eventually we may want to remove this module if it doesn't provide
// enough improvements over the built-in.
//var assert = require('assert');

function Test() {
	if (this instanceof Test) {
		this.pass = 0;
		this.fail = 0;
		
		return this;
	}
	else {
		return Test.prototype.assert.apply(this, arguments);
	}
}

Test.prototype = {
	assert: function(cond, message) {
		if (cond) {
			this.pass++;
		}
		else {
			this.fail++;
			console.log(message || 'Test case failed without error message.');
		}
	}
};

module.exports = Test;