/*
{
	jquery: {
		path: 'https://code.jquery.com/jquery-latest.min',
		styles: [

		]
	}
}

{
	'https://code.jquery.com/jquery-latest.min': 'jquery'
}

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
		throw new Error('No Promises/A+ library loaded.');
	}

	var window = this;
	var document = window.document;
	var head = document.getElementsByTagName('head')[0];

	// A cache of the defined modules.
	var modules = {};
	// A dictionary of name overrides for module definitions.
	var aliases = {};
	// A dictionary of external dependencies.
	var externals = {};
	// A dictionary of Deferred instances corresponding to the required modules.
	var waiting = {};
	// Queue to handle the
	var definitions = [];


	//var re_external = /^(?:[a-z]+):\/\//i;
	//var re_capture_name = /([^\/]+)$/;

	var listeners = {
		onerror: function onerror() {
			// FIXME: Do we need to manually remove the event listeners here too?
			this.parentNode.removeChild(this);
		},

		onload: function onload() {
			this.removeEventListener('load', listeners.onload);
			this.removeEventListener('error', listeners.onerror);

			_finishDefinition(this);
		}
	};


	/**
	 * Placeholder.
	 *
	 * @param {HTMLElement} [node]
	 * @private
	 */
	function _finishDefinition(node) {
		var definition, dependencies, factory, name, promises;

		definition = definitions.pop();

		// In some cases we'll be attempting to finish a definition that hasn't been declared yet.
		// For example if a require call comes before a define call:
		//
		//     require(['test-module'], function() { ... });
		//     define('test-module')
		//
		// If this is the case, `definition` here will be `undefined` and will need to be caught.
		//
		// FIXME: Does this have any unintended side-effects in the code?
		if (definition) {
			name = definition.name;
			dependencies = definition.dependencies;
			factory = definition.factory;

			if (node && aliases.hasOwnProperty(node.src)) {
				name = aliases[node.src];
			}

			promises = _getPromises(dependencies);

			if (!waiting.hasOwnProperty(name)) {
				waiting[name] = new Deferred();
			}

			Promise.all(promises).then(function() {
				var resolved;

				waiting[name].resolve();

				resolved = dependencies.map(function(name) {
					return modules[name];
				});

				modules[name] = factory.apply(window, resolved);
			});
		}
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
			node = document.createElement('script');
			node.type = type;
			node.charset = 'utf-8';
			node.async = true;

			node.addEventListener('load', listeners.onload);
			node.addEventListener('error', listeners.onerror);

			node.src = url + '.js';
		}
		else if (type === 'text/css') {
			node = document.createElement('link');
			node.type = type;
			node.rel = 'stylesheet';
			node.charset = 'utf-8';
			node.media = 'placeholder';

			// TODO: Should we add listeners to stylesheet loading too?
			// Technically they're supplemental requirements since CSS shouldn't be functionally linked to JS.
			// May not be consistent in all cases.

			node.href = url + '.css';
		}
		else {
			throw new Error('Invalid content type.');
		}

		head.appendChild(node);
	}


	/**
	 *
	 * @param {Array} dependencies
	 * @private
	 */
	function _loadDependencies(dependencies) {
		var i, j, dependency, name;

		for (i = 0; i < dependencies.length; i++) {
			name = dependencies[i];

			if (externals.hasOwnProperty(name)) {
				dependency = externals[name];

				if (dependency.path) {
					_load(dependency.path, 'text/javascript');
				}

				if (dependency.styles) {
					for (j = 0; j < dependency.styles.length; j++) {
						_load(dependency.styles[j], 'text/css');
					}
				}
			}
		}
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

		// TODO: Support unnamed definitions?

		definitions.push({
			name: name,
			dependencies: dependencies,
			factory: factory
		});

		if (!externals.hasOwnProperty(name)) {
			_finishDefinition();
		}

		// FIXME: Stylesheets should only load on require, not on define. Maybe pass a flag to _loadDependencies?
		// FIXME: When using aliases, the keys used for `waiting` do not use the proper aliases. This causes some out of order loading and/or indefinite resolution.
		_loadDependencies(dependencies);
	}


	/**
	 * Placeholder.
	 *
	 * @param {Object} options
	 * @returns {require}
	 */
	function config(options) {
		var name, path, styles, value;

		for (name in options) {
			if (!options.hasOwnProperty(name)) {
				break;
			}

			value = options[name];

			if (typeof value === 'string') {
				path = value;
				styles = []
			}
			else {
				path = value.path || null;
				styles = (value.styles) ? value.styles.slice() : [];
			}

			aliases[path + '.js'] = name;
			externals[name] = {
				path: path,
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
			throw new Error('Invalid callback supplied');
		}

		promises = _getPromises(dependencies);

		Promise.all(promises).then(function() {
			var resolved;

			resolved = dependencies.map(function(name) {
				return modules[name];
			});

			callback.apply(window, resolved);
		});

		_loadDependencies(dependencies);
	}


	define.amd = true;
	require.config = config;
	require.debug = {
		aliases: aliases,
		definitions: definitions,
		externals: externals,
		modules: modules,
		waiting: waiting
	};


	return {
		define: define,
		require: require
	};
});
