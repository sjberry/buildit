/**
 * @license
 * Copyright (C) 2015 Steven Berry (http://www.sberry.me/buildit)
 * Licensed: MIT (http://opensource.org/licenses/mit-license.php)
 *
 * Steven Berry
 * www.sberry.me
 * steven@sberry.me
 */


(function(root, factory) {
	var module;

	module = factory.call(root);

	root.define = module.define;
	root.require = module.require;
})(this, function() {
	// This library won't work without a valid promises library. Make sure there's one defined. Some newer browsers have
	// a Promise object defined by default which should be sufficient.
	if (!this.Promise) {
		throw new Error('No Promises/A+ or Promises/A library loaded.');
	}

	var window = this;
	var document = window.document;
	var head = document.getElementsByTagName('head')[0];

	var readyDeferred = new Deferred();
	var readyPromise = readyDeferred.promise;

	var configuration = {};
	var moduleConfig = configuration.modules = {};
	var moduleConfigByPath = {};

	// Queue to handle asynchronous calls to `define`.
	var defineStack = [];
	// A local cache of modules after they have been defined.
	var registry = {};
	// A dictionary of Deferred instances corresponding to the required modules.
	var waiting = {};

	var re_capture_name = /([^\/]+)$/;
	var re_strip_extension = /\.js$/i;


	readyDeferred.promise = readyDeferred.promise.bind(window);
	document.addEventListener('DOMContentLoaded', _listener$ready);
	window.addEventListener('load', _listener$ready);

	if (document.readyState === 'complete') {
		_listener$ready();
	}


	/**
	 *
	 */
	function _listener$error() {
		// TODO: Do we need to manually remove the event listeners here too?
		this.parentNode.removeChild(this);
	}


	/**
	 *
	 */
	function _listener$load() {
		var i, config, containsAnonymous, definition, node, path;

		this.removeEventListener('load', _listener$load);
		this.removeEventListener('error', _listener$error);

		node = this;
		path = node.src;
		config = moduleConfigByPath[path];

		if (config && config.rename === true) {
			if (defineStack.length > 1) {
				throw new Error('Attempt to apply a rename to a module with more than one define call.');
			}

			defineStack[0][0] = config.name;
		}
		else {
			containsAnonymous = false;

			for (i = 0; i < defineStack.length; i++) {
				if (!defineStack[i][0]) {
					containsAnonymous = true;
					break;
				}
			}

			if (containsAnonymous) {
				if (defineStack.length > 1) {
					throw new Error('Ambiguous anonymous module definition.');
				}

				defineStack[0][0] = re_capture_name.exec(path)[1].replace(re_strip_extension, '');
			}
		}

		while (defineStack.length > 0) {
			definition = defineStack.pop();
			_define.apply(window, definition);
		}
	}


	/**
	 *
	 */
	function _listener$ready() {
		document.removeEventListener('DOMContentLoaded', _listener$ready);
		window.removeEventListener('load', _listener$ready);

		readyDeferred.resolve();
	}


	/**
	 *
	 * @param {String} name
	 * @param {Array} dependencies
	 * @param {Function} factory
	 * @private
	 */
	function _define(name, dependencies, factory) {
		var promises;

		if (name == null) {
			throw new Error('Attempt to define anonymous module. A name could not be assumed.');
		}

		promises = _getPromises(dependencies);

		if (!waiting.hasOwnProperty(name)) {
			waiting[name] = new Deferred();
		}

		Promise.all(promises).then(function() {
			var modules;

			waiting[name].resolve();

			modules = dependencies.map(function(name) {
				return registry[name];
			});

			registry[name] = factory.apply(window, modules);
		});
	}


	/**
	 *
	 *
	 * @param {Array} dependencies An array of string dependency names.
	 * @returns {Array} An array of promises corresponding to the specified dependencies with states appropriate for the load status of the dependency.
	 * @private
	 */
	function _getPromises(dependencies) {
		var promises;

		promises = dependencies.map(function(name) {
			var deferred;

			if (waiting.hasOwnProperty(name)) {
				return waiting[name].promise;
			}
			else {
				waiting[name] = deferred = new Deferred();

				return deferred.promise;
			}
		});

		promises.push(readyPromise);

		return promises;
	}


	/**
	 *
	 * @param {String} url
	 * @param {String} type
	 * @returns {require}
	 */
	function _load(url, type) {
		var node;

		if (type === 'text/javascript') {
			url += '.js';

			if (node = document.querySelector('script[src="' + url + '"]')) {
				return node;
			}

			node = document.createElement('script');
			node.type = type;
			node.charset = 'utf-8';
			node.async = true;

			node.addEventListener('load', _listener$load);
			node.addEventListener('error', _listener$error);

			node.src = url;
		}
		else if (type === 'text/css') {
			url += '.css';

			if (node = document.querySelector('link[rel="stylesheet"][href="' + url + '"]')) {
				return node;
			}

			node = document.createElement('link');
			node.type = type;
			node.rel = 'stylesheet';
			node.charset = 'utf-8';
			//node.media = 'none';

			// TODO: Should we add listeners to stylesheet loading too?
			// Technically they're supplemental requirements since CSS shouldn't be functionally linked to JS.
			// May not be consistent in all cases.

			node.href = url;
		}
		else {
			throw new Error('Invalid content type.');
		}

		head.appendChild(node);

		return node;
	}


	/**
	 *
	 * @param {Array} dependencies
	 * @private
	 */
	function _loadDependencies(dependencies) {
		var i, config, name, path;

		for (i = 0; i < dependencies.length; i++) {
			name = dependencies[i];
			config = moduleConfig[name];

			if (config && (path = config.path)) {
				_load(path, 'text/javascript');
			}
		}
	}


	/**
	 *
	 *
	 * @private
	 */
	function _redraw() {
		var node;

		node = document.createElement('script');
		head.appendChild(node);
		head.removeChild(node);
	}


	/**
	 *
	 * @returns {Deferred}
	 * @constructor
	 */
	function Deferred() {
		var that = this;

		this.promise = new Promise(function(resolve, reject) {
			that.resolve = resolve;
			that.reject = reject;
		});
	}


	/**
	 *
	 * @param {String} [name]
	 * @param {Array} dependencies
	 * @param {Function} factory
	 */
	function define(name, dependencies, factory) {
		if (typeof name != 'string' && factory == null) {
			factory = dependencies;
			dependencies = name;
			name = void(0);
		}

		defineStack.push([name, dependencies, factory]);

		_loadDependencies(dependencies);
	}


	/**
	 * Placeholder.
	 *
	 * @param {Object} options
	 * @returns {require}
	 */
	function config(options) {
		var name, path, rename, styles, value;

		for (name in options) {
			if (!options.hasOwnProperty(name)) {
				break;
			}

			value = options[name];

			// If the value corresponding to the `name` key is a string, then it's a "simple" configuration entry and
			// is just the value of the path.
			if (typeof value === 'string') {
				path = value;
				styles = []
			}
			else {
				// If the path is null, then the specified module is understood to be "internal." An internal module is
				// one that is loaded via a markup script tag rather than one "required" in dynamically via the loader.
				path = value.path || null;
				styles = (value.styles) ? value.styles.slice() : [];
				rename = value.rename || false;
			}

			moduleConfig[name] = moduleConfigByPath[path + '.js'] = {
				name: name,
				path: path,
				rename: rename,
				styles: styles
			};
		}
	}


	/**
	 *
	 * @param callback
	 */
	function ready(callback) {
		readyPromise.then(function() {
			callback.call(window);
		});
	}


	/**
	 * Placeholder.
	 *
	 * @param {String|Array} dependencies
	 * @param {Function} callback
	 */
	function require(dependencies, callback) {
		var name, promises;

		if (typeof dependencies === 'string' && callback == null) {
			name = dependencies;

			if (!modules.hasOwnProperty(name)) {
				throw new Error('Module `' + name + '` not yet defined.');
			}

			return modules[name];
		}

		if (typeof callback !== 'function') {
			throw new Error('Invalid callback supplied.');
		}

		promises = _getPromises(dependencies);

		Promise.all(promises).then(function() {
			var modules;

			modules = dependencies.map(function(name) {
				var i, config, styles;

				config = moduleConfig[name];

				if (config && (styles = config.styles)) {
					for (i = 0; i < styles.length; i++) {
						// FIXME: This is sensitive to redraw computation. It may not be an issue if dependencies are loaded onReady rather than in response to user events later.
						// Potential solution to use deferred queue with a .then() callback to set media type to "all" from "none" (i.e. force a "single" redraw).
						_load(styles[i], 'text/css');
					}
				}

				return registry[name];
			});

			callback.apply(window, modules);
		});

		_loadDependencies(dependencies);
	}


	define.amd = true;
	require.config = config;
	require.ready = ready;
	require.debug = {
		configuration: configuration,
		defineStack: defineStack,
		registry: registry,
		waiting: waiting,

		load: _load,
		redraw: _redraw
	};


	return {
		define: define,
		require: require
	};
});
