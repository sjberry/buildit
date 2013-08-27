module.exports = {
	log: function(text) {
		return console.log(text);
	},
	
	ok: function(text) {
		return console.log('\u001b[32;1m' + text + '\u001b[0m');
	},
	
	info: function(text) {
		return console.log('\u001b[36;1mINFO: ' + text + '\u001b[0m');
	},
	
	warn: function(text) {
		return console.log('\u001b[33;1mWARNING: ' + text + '\u001b[0m');
	},
	
	error: function(text) {
		return console.log('\u001b[31;1mERROR: ' + text + '\u001b[0m');
	}
};