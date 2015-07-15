/**
 * @license
 * Copyright (C) 2015 Steven Berry (http://www.sberry.me/buildit)
 * Licensed: MIT (http://opensource.org/licenses/mit-license.php)
 *
 * Steven Berry
 * www.sberry.me
 * steven@sberry.me
 */


function Module(factory) {
	this.waiting = true;
	this.factory = factory;
}


function _define(path, factory) {
	cache[path] = new Module(factory);
}


function require(path) {
	var exports, factory, module, modpaths, modrequire;

	module = cache[path];

	if (module instanceof Module) {
		if (!module.waiting) {
			throw new Error('Circular dependency in module "' + path + '"');
		}

		factory = module.factory;
		module.waiting = false;
		module = {};
		module.exports = exports = {};

		if (modpaths = mappings[path]) {
			modrequire = function(name) {
				return require(modpaths[name] || name);
			};
		}
		else {
			modrequire = require;
		}

		factory(modrequire, module, exports);

		return cache[path] = module.exports;
	}

	return module;
}
