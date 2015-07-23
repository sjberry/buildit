# buildit
Converts CommonJS (e.g. node) style code to AMD-compliant (e.g. requirejs) bundles.


## Usage
Programmatic usage of **buildit** is straightforward. The `buildit` function accepts a string pattern (or array of
string patterns) and configuration options. The pattern format conforms to the standard seen in
[GruntJS](http://gruntjs.com/) and is supported by the [glob](https://www.npmjs.org/package/glob) dependency.

```javascript
var buildit = require('buildit');

var out = buildit({
  baseUrl: '.',
  name: 'mybundle',
  define: {
    mymod1: 'src/mymod1',
    mymod2: 'src/mymod2',
  }
  exports: {
    mymod1: 'src/mymod1',
    mymod2: 'src/mymod2'
  }
});

console.log(out);
```

By default, the `buildit` function will automatically run with the supplied arguments. However, running can be delayed
and patterns can be built up manually as follows:

```javascript
var Buildit = require('buildit').Buildit;

var buildit = new Buildit({
  baseUrl: '.',
  name: 'mybundle',
  define: {
    mymod1: 'src/mymod1',
    mymod2: 'src/mymod2',
  }
  exports: {
    mymod1: 'src/mymod1',
    mymod2: 'src/mymod2'
  }
});

var out = buildit.run();

console.log(out);
```

The `Buildit` constructor accepts the same arguments as the `buildit` function (but just exposes the additional
`.run()` method).

### Options
**baseUrl** &ndash; The folder to use as the current working directory. The specified path is relative to the directory
initiating the NodeJS script. Defaults to `.`.

**name** &ndash; An optional name for the code bundle. This follows the AMD standard and manifests as:

```javascript
define(name, [ ... ], function( ... ) {
  ...
});
```

If no name is supplied the bundle definition will instead be:

```javascript
define([ ... ], function( ... ) {
  ...
});
```

**define** &ndash; Internal modules can be defined in the AMD scope. The `define` option is a plain object with
key/value pairs corresponding to the name that should be used for the defined AMD module and the path to the dependency.
Similar to the RequireJS optimizer, the ".js" extension should be excluded from the module path as it is added
automatically. Only definitions corresponding to files found by the supplied pattern(s) will be successfully defined.
Defined modules can be found after requiring the bundle itself with an AMD loader. From the primary usage example above:

```javascript
require(['mybundle'], function(mybundle) {
  // Individual modules in `mybundle` are now available.

  require(['mymod1', 'mymod2'], function(mymod1, mymod2) {
    // This should work!
  });
});
```

OR

```javascript
require(['mybundle'], function(mybundle) {
  // Individual modules in `mybundle` are now available.
});

require(['mymod1', 'mymod2'], function(mymod1, mymod2) {
  // This should work!
});
```

**exports** &ndash; Internal modules can be directly exported in the defined bundle. The `exports` option is a plain
object with key/value pairs corresponding to the name that should be used for exportation and the path to the
dependency. Similar to the RequireJS optimizer, the ".js" extension should be excluded from the module path as it is
added automatically. Only exports corresponding to files found by the supplied pattern(s) will be sucessfully exported.
Exported modules can be accessed after requiring the bundle itself with an AMD loader. From the primary usage example
above, the `exports` option would manifest in the bundle as:

```javascript
define(name, [ ... ], function( ... ) {
  // Internal bundling code

  return {
    mod1: require('src/mymod1'),
    mod2: require('src/mymod2')
  };
});
```

Individual modules can then be accessed as follows:

```javascript
require(['mybundle'], function(mybundle) {
  mybundle.mod1; // Should be defined.
  mybundle.mod2; // Should be defined.
});
```

The `exports` option can also be a string to enable a singular module export. For example, the following configuration:

```javascript
var buildit = require('buildit');

var out = buildit({
  baseUrl: '.',
  name: 'mybundle',
  exports: 'src/mymod1'
});

console.log(out);
```

Would result in the bundle:

```javascript
define('mybundle', [ ... ], function( ... ) {
   // Internal bundling code
   
   return require('src/mymod1');
});
```

The module would then be accessed as follows:

```javascript
require(['mybundle'], function(mybundle) {
  mybundle; // Should be defined and equivalent to the exports of "src/mymod1".
});
```

Note that the **define** and **exports** options are not mutually exlusive and there can be overlap between exported
modules and AMD-defined modules. While this can be redundant and doesn't necessarily make sense, the flexibility is
maintained.


### Command-line Support
**buildit** cannot currently be run from the command line.
Command-line execution will be added in future versions.


## Limitations
**buildit** is NOT a 1:1 replacement for [browserify](http://browserify.org/) or [webpack](http://webpack.github.io/).
NodeJS dependencies are not traced completely. That is to say, only local dependencies (e.g. `./src/test.js`) will be
included in compiled bundles.

It is assumed that external dependencies (e.g. jQuery or lodash) would be AMD required through CDN or compiled with
something like the [RequireJS optimizer](https://github.com/jrburke/r.js/).

**buildit** does not patch or wrap Node-only libraries (e.g. NodeJS builtins) to make them usable in the browser, nor
does it include them in the build. For example, code like:

```javascript
var jquery = require('jquery');
var fs = require('fs');

module.exports = {};
```

Would translate to a bundle like:

```javascript
define(['fs', 'jquery'], function(fs, jquery) {
  // Internal bundling code
});
```

There are no warning messages issued for code depending on NodeJS builtins.

To reiterate, **buildit** is only intended to package locally defined-CommonJS modules into AMD compliant blocks that
can THEN be used in an AMD build-optimization process or be deployed directly in a script tag (provided all dependencies
are otherwise met).


## Testing
**buildit** has admittedly poor test coverage. Everything seems to work when I use this library for my own projects, but
please feel free to report any issues you come across. I'm working to improve test coverage in future versions.


## Notes
### Circular Module Dependencies
Circular dependencies are not currently supported. I am aware that NodeJS currently supports
[module cycles](http://nodejs.org/api/modules.html#modules_cycles). I haven't found a good reason to support circular
module definition in my own projects. If this changes, or if circular dependency support becomes a requested feature,
**buildit** may support circular dependencies in the future.

### Path Obfuscation
Internal path definitions make use of relative pathing from the specified `baseUrl` to the included modules. This is to
protect the privacy of your filesystem as much as possible and to improve minification potential.

### Dependency Idiosyncrasies
**buildit** depends on [**detective**](https://www.npmjs.org/package/detective) to trace module dependencies. As such
any weaknesses in **detective** manifest in **buildit**, so please report dependency discovery issues accordingly.
Specific deficiencies I've noticed are:
  * Non-literal require statements
```javascript
var test = 'test';
var mymodule = require(__dirname + '/lib/' + test);
```
  * Offsetting require
```javascript
var t = require;
var mymodule = t('mymodule');
```
