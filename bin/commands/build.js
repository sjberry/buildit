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
			required: true,
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

	build(args.template);
}


module.exports = {
	main: main
};
