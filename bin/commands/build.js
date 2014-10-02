var path = require('path');

var optionator = require('optionator');

var build = require('../../lib/build');


var argParser = optionator({
	prepend: 'Usage: buildit build [options]',
	options: [
		{
			option: 'help',
			alias: 'h',
			type: 'Boolean',
			description: 'Displays help'
		},
		{
			option: 'template',
			alias: 't',
			type: 'String',
			description: 'The path to the template file'
		}
	]
});


/**
 * Builds a buildit template file and renders the result to stdout.
 *
 * @param {Array} argv An array of command line arguments.
 * @returns {*} Returns the help string if the help option flag is specified, otherwise nothing.
 */
function main(argv) {
	var args;

	args = argParser.parse(argv);

	if (args.help) {
		return argParser.generateHelp();
	}

	if (!args.template) {
		throw new Error('Error: Option --template is required.')
	}

	build(args.template);
}


module.exports = {
	main: main
};
