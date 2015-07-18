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

	// Queue to handle asynchronous calls to `define`.
	var defineStack = [];
	// A local cache of modules after they have been defined.
	var registry = {};

	var re_capture_name = /([^\/]+)$/;
	var re_strip_extension = /\.js$/i;

	// Create a ready promise so that require calls need not be placed inside something like a $(document).ready(...)
	// call. This promise is inserted into the array of dependency promises when Promises.all(...) is called for
	// resolving modules. The IEFE is used here to prevent scope pollution.
	//
	// The deferred instance isn't garbage collected here as a result of how this code is constructed, but the footprint
	// is insignificant.
	var ready = (function() {
		var deferred;

		deferred = new Deferred();

		function listener() {
			document.removeEventListener('DOMContentLoaded', listener);
			window.removeEventListener('load', listener);

			deferred.resolve();
		}

		document.addEventListener('DOMContentLoaded', listener);
		window.addEventListener('load', listener);

		if (document.readyState === 'complete') {
			listener();
		}

		return deferred.promise.bind(window);
	})();


	/**
	 *
	 * @param name
	 * @private
	 */
	function _executeDefines(name) {
		var i, containsAnonymous, definition, module;

		for (i = 0; i < defineStack.length; i++) {
			if (!defineStack[i][0]) {
				containsAnonymous = true;
				break;
			}
		}

		if (containsAnonymous) {
			if (defineStack.length > 1) {
				throw new Error('Mismatched anonymous define() call');
			}
			else if (name == null) {
				throw new Error('Mismatched anonymous define() call');
			}
		}

		while (defineStack.length > 0) {
			definition = defineStack.pop();

			if (definition[0] == null) {
				definition[0] = name;
			}

			name = definition[0];

			if (registry.hasOwnProperty(name)) {
				throw new Error('Attempt to redefine "' + name + '".');
			}

			module = _getModule(name);
			module.init.apply(module, definition);
		}
	}


	/**
	 *
	 *
	 * @param name
	 * @returns {*}
	 * @private
	 */
	function _getModule(name) {
		var module;

		if (module = registry[name]) {
			return module;
		}

		return registry[name] = new Module(name);
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
			return _getModule(name).ready;
		});

		promises.push(ready);

		return promises;
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
	 * Placeholder.
	 *
	 * @param name
	 * @param dependencies
	 * @param factory
	 * @constructor
	 */
	function Module(name, dependencies, factory) {
		var deferred, that = this;

		this.init(name, dependencies, factory);

		this._deferred = deferred = new Deferred();
		this.ready = deferred.promise;

		this.onerror = function() {
			Module.prototype.onerror.call(that, this, that);
		};

		this.onload = function() {
			Module.prototype.onload.call(that, this, that);
		};
	}

	Module.prototype = {
		loaded: false,
		path: null,
		rename: false,
		resolved: null,
		styles: [],

		/**
		 *
		 * @param conf
		 * @returns {Module} Chainable.
		 */
		config: function Module$config(conf) {
			var path, styles;

			// If the value corresponding to the `name` key is a string, then it's a "simple" configuration entry and
			// is just the value of the path.
			if (typeof conf === 'string') {
				this.path = value;
			}
			else {
				if (path = conf.path) {
					this.path = path;
				}

				if (styles = conf.styles) {
					this.styles = styles.slice();
				}

				this.rename = !!conf.rename;
			}

			return this;
		},

		/**
		 *
		 * @param name
		 * @param dependencies
		 * @param factory
		 * @returns {Module} Chainable.
		 */
		init: function Module$init(name, dependencies, factory) {
			this.name = name;
			this.dependencies = dependencies;
			this.factory = factory;

			return this;
		},

		/**
		 *
		 * @returns {Module} Chainable.
		 */
		load: function Module$load() {
			var i, node, path, styles;

			if (!this.loaded) {
				path = this.path + '.js';
				node = document.querySelector('link[rel="stylesheet"][href="' + path + '"]');
				styles = this.styles;

				if (!node) {
					node = document.createElement('script');
					node.type = 'text/javascript';
					node.charset = 'utf-8';
					node.async = true;

					node.addEventListener('load', this.onload);
					node.addEventListener('error', this.onerror);

					node.src = path;

					head.appendChild(node);
				}

				// FIXME: This is sensitive to redraw computation. It may not be an issue if dependencies are loaded onReady rather than in response to user events later.
				// Potential solution to use deferred queue with a .then() callback to set media type to "all" from "none" (i.e. force a "single" redraw).
				for (i = 0; i < styles.length; i++) {
					path = styles[i] + '.css';

					if (node = document.querySelector('link[rel="stylesheet"][href="' + path + '"]')) {
						continue;
					}

					node = document.createElement('link');
					node.type = 'text/css';
					node.rel = 'stylesheet';
					node.charset = 'utf-8';
					//node.media = 'none';

					node.href = path;

					head.appendChild(node);
				}
			}

			return this;
		},

		/**
		 *
		 * @param node
		 * @param module
		 */
		onerror: function Module$onerror(node, module) {
			node.parentNode.removeChild(node);

			throw new Error('Error loading external dependency "' + node.src + '".');
		},

		/**
		 *
		 * @param node
		 * @param module
		 */
		onload: function Module$onload(node, module) {
			var name, path;

			node.removeEventListener('load', module.onload);
			node.removeEventListener('error', module.onerror);

			path = node.src;
			name = (module.rename) ? module.name : re_capture_name.exec(path)[1].replace(re_strip_extension, '');

			_executeDefines(name);
		}
	};


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
	}


	/**
	 * Placeholder.
	 *
	 * @param {Object} options
	 * @returns {require}
	 */
	function config(options) {
		var name, conf, module;

		for (name in options) {
			if (!options.hasOwnProperty(name)) {
				break;
			}

			conf = options[name];
			module = _getModule(name);

			module.config(conf);
		}
	}


	/**
	 * Placeholder.
	 *
	 * @param {String|Array} dependencies
	 * @param {Function} callback
	 */
	function require(dependencies, callback) {
		var module, name, promises;

		if (typeof dependencies === 'string' && callback == null) {
			name = dependencies;
			module = registry[name];

			if (module && module.resolved) {
				return module.resolved;
			}

			throw new Error('Module `' + name + '` not yet defined.');
		}

		if (typeof callback !== 'function') {
			throw new Error('Invalid callback supplied.');
		}

		_executeDefines();

		promises = _getPromises(dependencies);

		Promise.all(promises).then(function() {
			var modules;

			modules = dependencies.map(function(name) {
				return registry[name].resolved;
			});

			callback.apply(window, modules);
		});

		// Kick off the recursive load process here. If a module is defined and has a path, then included that <script>.
		// Otherwise just chill out and wait for a define call. This is so we can call defines after requires.
		// This will have to be listened for in the .config() prototype method (i.e. if `required` and all of a sudden there's a path, it needs to load immediately.
	}


	define.amd = true;
	require.config = config;
	require.debug = {
		defineStack: defineStack,
		registry: registry,

		ready: ready
	};


	return {
		define: define,
		require: require
	};
});
