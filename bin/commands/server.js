var path = require('path');
var url = require('url');

var express = require('express');
var optionator = require('optionator');


var argParser = optionator({
	prepend: 'Usage: buildit server [options]',
	options: [
		{
			option: 'help',
			alias: 'h',
			type: 'Boolean',
			description: 'Displays help'
		},
		/*
		{
			option: 'port',
			alias: 'p',
			type: 'Integer',
			description: 'The port on which to listen for incoming connections'
		},
		*/
		{
			option: 'settings',
			alias: 's',
			type: 'String',
			description: 'The path to the settings file'
		}
	]
});

var settings = {
	port: 5000,
	staticRoot: process.cwd(),
	scripts: [],
	styles: []
};


/**
 * Placeholder.
 *
 * @private
 * @param request
 * @param response
 * @param next
 */
function _connectionLogger(request, response, next) {
	var href, ip, method, now, version;

	ip = request.connection.remoteAddress;
	method = request.method;
	now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
	href = request.url;
	version = request.httpVersion;

	console.log('%s -- [%s] HTTP/%s %s "%s"', ip, now, version, method, href);

	next();
}


/**
 * Placeholder.
 *
 * @private
 * @param {String} href
 * @returns {String}
 */
function _getStaticUrl(href) {
	var parsed;

	parsed = url.parse(href);

	return parsed.protocol ? href : ('/static/' + href);
}


/**
 * Placeholder.
 *
 * @private
 * @param {String} filename
 * @returns {*}
 */
function _loadSettings(filename) {
	var name, dir, userSettings, staticRoot;

	if (filename) {
		filename = path.resolve(filename);

		dir = path.dirname(filename);
		userSettings = require(filename);

		if (staticRoot = userSettings.staticRoot) {
			userSettings.staticRoot = path.resolve(path.join(dir, staticRoot));
		}
	}

	for (name in userSettings) {
		if (userSettings.hasOwnProperty(name)) {
			settings[name] = userSettings[name];
		}
	}
}


function main(argv) {
	var app, args;

	args = argParser.parse(argv);

	if (args.help) {
		return argParser.generateHelp();
	}

	_loadSettings(args.settings);

	app = express();

	app.all('*', _connectionLogger);

	app.route('/')
		.get(function(request, response) {
			var i, content, url;

			content = '<DOCTYPE html><html lang="en-US"><head><meta charset="utf-8" />';

			for (i = 0; i < settings.scripts.length; i++) {
				url = _getStaticUrl(settings.scripts[i]);
				content += '<script type="text/javascript" src="' + url + '"></script>';
			}

			for (i = 0; i < settings.styles.length; i++) {
				url = _getStaticUrl(settings.styles[i]);
				content += '<link rel="stylesheet" type="text/css" href="' + url + '" />';
			}

			content += '</head><body><div id="qunit"></div><div id="qunit-fixture"></div></body></html>';

			response.send(content);
		});

	app.route('/ajax')
		.get(function(request, response) {
			response.send('Test');
		});

	app.use('/static', express.static(settings.staticRoot));

	// Run server.
	app.listen(settings.port, function() {
		console.log('Running Express server - listening on port %d.', settings.port);
	});
}


module.exports = {
	main: main,
	persist: true
};
