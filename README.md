# buildit #
Buildit is a(nother) set of JavaScript project build and test utilities for NodeJS.

I developed Buildit to get acquainted with NodeJS development and to aid in the development of a few private projects I maintain and use. I'm certainly not trying to supersede any existing libraries, but my feature set gradually became more coherent and objectively useful. So I pushed the source to this repository and started publishing the library to the Node Packaged Modules registry (NPM).


## Overview ##
Buildit currently supports:

* Building source files into a single distributable library file according to a template.
* Importing source files into the NodeJS global scope for use in test cases and benchmarking.
* Creating benchmarking suites and acquiring metrics on baseline code performance.
* Creating/running test suites.

Features lined up in the next few versions:

* Improve support for creating, running, and analyzing test suites. I'd like to output statistics to JSON so that they can be plotted or published.
* Improve code benchmarking support (it's a bit simple right now). Again, outputting to JSON would be nice.
* Name benchmark/test suites.
* Integrate with Grunt.
* Support command line buildit.build (the other features don't make sense in this context though).


## Installation ##
Buildit can be easily installed using NPM.

```npm install buildit```

Once installed, you can include the library using:

```javascript
var buildit = require('buildit');
```

Command-line integration is also supported. The specific commands are detailed in a subsequent section.

```npm install -g buildit```

**Note:** Using sudo will likely be necessary if on a *nix system.

Buildit is currently semi-stable and subject to a number of revisions over the coming weeks. Feel free to download and use it as is, but I can't recommend it for a production environment yet.

Buildit it should work fine for simple tasks by itself. But there are a number of quality of life improvements I need to implement to get it out of its alpha state.

## Components ##
Buildit comes with a few different components that let you perform a variety of tasks.

### BUILD ###
The ```build(template)``` function is used for file concatenation and accepts one argument. ```template``` specifies the template that will be iterated over and used as a skeleton (of sorts) for importing. Imported files are concatenated and rendered to stdout. Example usage:

```javascript
var buildit = require('buildit');
buildit.build('template.js');
```

The ```build``` function uses a specific template format that's subject to change if I find a better alternative. Right now a template (e.g. ```template.js```) may look something like:

```javascript
(function(window, undefined) {
  @import "src/util"
})(this);
```

If this template is built, all files at and below  ```./src/util``` will be included in the order they are encountered in a simple file walk.

Depending on your library structure, it may be necessary to increase the priority of particular files or directories (e.g. for dependency reasons). This can be easily achieved with something like:

```javascript
(function(window, undefined) {
  @import "src/util/ex/test.js"
  @import "src/util"
})(this);
```

Even though the first included file would be found in both imports, it will not be re-included with the second import. Also note that the indentation of the ```@import``` statement will match the block-level indentation of all the files matched to that import rule.

I'll eventually support a more RegExp oriented file matching pattern to make excluding files easier.


### LOAD (UNSTABLE) ###
The ```load(path, refresh)``` function is used for importing files into the ```global``` context and accepts two arguments. ```path``` is the path that will be used as a starting point for a simple file walk. All files at this directory level and below will be imported. ```refresh``` is a boolean flag indicating whether or not the files should forcibly be reloaded. Example usage:

```javascript
var buildit = require('buildit');
buildit.load('src');
```

You will encounter console warnings if you've included files with overlapping variable names. The most recently loaded file will be the active source definition for a conflicted variable.

You can easily check what variables are currently loaded using:

```javascript
buildit.load.vars
```

This variable is a plain JavaScript object that uses the variable names as keys and the defining source file as values.

Buildit currently supports automatic file reloading, but it relies on an unstable feature of NodeJS. So I make no guarantees about this actually working in your environment. I can only currently test on Windows and it works all right there.

Essentially if a file is loaded with ```load``` a listener is created using ```fs.watch``` to monitor for file-system change events. If the listener callback fires, then the modified file is automatically reimported. A console info message will indicate these updates. Console warnings for overwriting variable names will show up for automatically re-imported files as well.


### BENCHMARK ###
Buildit supports basic benchmarking of callback functions. Right now, ```buildit.benchmark``` can be used to create benchmark suites with named test cases or to time one-off callbacks.

For single assert statements use ```buildit.benchmark(fn, n)```, where ```fn``` is the test callback function and ```n``` is (optionally) the number of times the test should be repeated. Repeating a benchmark helps get more accurate results for extraordinarily fast (sub 1ms) callbacks. Though if you're testing for bottlenecks, this is of limited use. Example usage:

```javascript
var buildit = require('buildit');
buildit.benchmark(function() {
    return x = 6;
}, 10000);
```

To create a benchmark-suite, create a new instance of the ```buildit.benchmark``` function with optional initial tests.

```javascript
var buildit = require('buildit');
var suite = new buildit.benchmark({
    'named_benchmark': function() {
        return x = 6;
    }
});
suite.exec('named_benchmark', 10000);
```

To add benchmarks to a suite after it has been initialized you can use:

```javascript
suite.add({
    'named_benchmark': function() {
        return x = 6;
    }
});
```

### TEST ###
Buildit supports rudimentary test suites. I'm looking into providing a layer of functionality over the built-in ```require('assert')``` to justify keeping this feature included. Right now, ```buildit.test``` can be used to create test suites that automatically track the number of pass/fail test cases or to run one-off assert statements.

For single assert statements use ```buildit.test(cond, message)```, where ```cond``` is the test condition and ```message``` is the message logged to the console if the test case fails. Example usage:

```javascript
var buildit = require('buildit');
buildit.test(0 == 1, 'The unachievable has not been achieved.');
```

To create a test-suite, create a new instance of the ```buildit.test``` function.

```javascript
var buildit = require('buildit');
var suite = new buildit.test();
suite.assert(0 == 1, 'The unachievable has not been achieved.');
```

For any given suite, the number of passed assert statements can be found with ```suite.pass``` and the number of failed statements can be found with ```suite.fail```.

## Command-line Integration ##
There are a few tasks that can be run directly from the command line. Currently the following commands are supported:

* **build** &ndash; A shortcut for the buildit `build` functionality.
* **server** &ndash; A rudimentary local development server written with Express for serving static files and simple routes.

### build ###
The build functionality can be run from the command line through node with:

```buildit build [options]```
