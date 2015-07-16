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

	var configuration = {};
	var moduleConfig = configuration.modules = {};
	var moduleConfigByPath = {};

	// A dictionary containing forced name overrides for externally required modules.
	var nameOverrides = {};
	// A local cache of modules after they have been defined.
	var resolved = {};
	// A dictionary of Deferred instances corresponding to the required modules.
	var waiting = {};
	// Queue to handle asynchronous calls to `define`.
	var defineStack = [];

	var re_capture_name = /([^\/]+)$/;
	var re_strip_extension = /\.js$/i;

	var listeners = {
		onerror: function onerror() {
			// TODO: Do we need to manually remove the event listeners here too?
			this.parentNode.removeChild(this);
		},

		onload: function onload() {
			this.removeEventListener('load', listeners.onload);
			this.removeEventListener('error', listeners.onerror);

			console.log(this);

			//_finishDefinition(this);
		}
	};


	/**
	 * Placeholder.
	 *
	 * @param {HTMLElement} [node]
	 * @private
	 */
	function _finishDefinition(node) {
		var config, definition, dependencies, factory, name, path, promises;

		definition = defineStack.pop();

		name = definition.name;
		dependencies = definition.dependencies;
		factory = definition.factory;

		if (node) {
			path = node.src;
			config = moduleConfigByPath[path];

			if (config && config.rename === true) {
				// We can be sure this `name` property exists because we set it programatically in the .config() function.
				name = config.name;
			}
			else if (name == null) {
				name = re_capture_name.exec(path)[1].replace(re_strip_extension, '');
			}
		}

		if (name == null) {
			throw new Error('Unnamed local modules not supported. Optimize this module to automatically add a name.');
		}

		promises = _getPromises(dependencies);

		if (!waiting.hasOwnProperty(name)) {
			waiting[name] = new Deferred();
		}

		Promise.all(promises).then(function() {
			var modules;

			waiting[name].resolve();

			modules = dependencies.map(function(name) {
				return resolved[name];
			});

			resolved[name] = factory.apply(window, modules);
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
		return dependencies.map(function(name) {
			var deferred;

			if (waiting.hasOwnProperty(name)) {
				return waiting[name].promise;
			}
			else {
				waiting[name] = deferred = new Deferred();

				return deferred.promise;
			}
		});
	}


	/**
	 *
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

			node.addEventListener('load', listeners.onload);
			node.addEventListener('error', listeners.onerror);

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
		console.log('here');

		if (typeof name != 'string' && factory == null) {
			factory = dependencies;
			dependencies = name;
			name = void(0);
		}

		defineStack.push({
			name: name,
			dependencies: dependencies,
			factory: factory
		});

		// FIXME: How do we prevent this function from running immediately on an async loaded module?
		// This issue blocks force renaming modules and dynamically naming modules based on file names (without preoptimization).
		//_finishDefinition();

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

				return resolved[name];
			});

			callback.apply(window, modules);
		});

		_loadDependencies(dependencies);
	}


	define.amd = true;
	require.config = config;
	require.debug = {
		configuration: configuration,
		defineStack: defineStack,
		resolved: resolved,
		waiting: waiting,

		load: _load,
		redraw: _redraw
	};


	return {
		define: define,
		require: require
	};
});
