/**
 * This is a small logger extension used internally for npm-buildit.
 * This achieves similar results as other dedicated NodeJS colorization libraries.
 * However it is much more targeted to npm-buildit specific needs.
 */
module.exports = {
	/**
	 * Logs the specified text to the NodeJS console.
	 */
	log: function(text) {
		return console.log(text);
	},
	
	/**
	 * Logs the specified text to the NodeJS console colorized GREEN.
	 */
	ok: function(text) {
		return console.log('\u001b[32;1m' + text + '\u001b[0m');
	},
	
	/**
	 * Logs the specified text to the NodeJS console colorized BLUE.
	 */
	info: function(text) {
		return console.log('\u001b[36;1mINFO: ' + text + '\u001b[0m');
	},
	
	/**
	 * Logs the specified text to the NodeJS console colorized YELLOW.
	 */
	warn: function(text) {
		return console.log('\u001b[33;1mWARNING: ' + text + '\u001b[0m');
	},
	
	/**
	 * Logs the specified text to the NodeJS console colorized RED.
	 */
	error: function(text) {
		return console.log('\u001b[31;1mERROR: ' + text + '\u001b[0m');
	}
};