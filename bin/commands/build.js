var path = require('path');

var optionator = require('optionator');

var build = require('../../lib/build');


var argParser = optionator({
	prepend: 'Usage: buildit server [options]',
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
