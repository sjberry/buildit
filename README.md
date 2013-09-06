#npm-buildit

Buildit is a(nother) set of JavaScript project build and test utilities for NodeJS.

I developed Buildit to get accquanted with NodeJS development and to aid in the development of a few private projects I maintain and use. I'm certainly not trying to supercede any existing libraries, but my feature set gradually became more coherent and objectively useful. So I pushed the source to this repository and started publishing the library to the Node Packaged Modules registry (NPM).

##Overview

Buildit currently supports:

* Building source files into a single distributable library file according to a template.
* Importing source files into the NodeJS global scope.

I have a few features from other mini-libraries I've written that I plan to integrate:

* Create, run, and analyze test suites
* Benchmark code blocks or specific functions (metrics will be particular to NodeJS's fork of V8)
* Integrate with Grunt
* Use output buffers to improve performance in flash-drive project directories

##Installation

Buildit can be easily installed using NPM.

```npm install buildit```

Once installed, you can include the library using:

```javascript
var buildit = require('buildit');
```

Buildit is currently semi-stable and subject to a number of revisions over the coming weeks. Feel free to download and use it as is, but I can't recommend it for a production environment.

Buildit it should work fine for simple tasks by itself. But there are a number of quality of life improvements I need to implement to get it out of its alpha state.

##BUILD

The ```build(template, output)``` function is used for file concatenation and accepts two arguments. ```template``` specifies the template that will be iterated over and used as a skeleton (of sorts) for importing. ```output``` is optional and specifies the output file. By default the output file will be ```./build/output.js```. You can't change the output directly, only the name of the file. Example usage:

```javascript
var buildit = require('buildit');
buildit.build('core.js', 'library.js');
```

The ```build``` function uses a specific template format that's subject to change if I find a better alternative. Right now a template (e.g. ```core.js```) may look something like:

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

I'll eventually support a more RegExp oriented file matching pattern to make exluding files easier.

##LOAD

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

This variable is a plain JavaScript object that uses the variable names as keys and defining source file as values.

Buildit currently supports automatic file reloading, but it relies on an unstable feature of NodeJS. So I make no guarantees about this actually working in your environment. I can only currently test on Windows and it works all right there.

Essentially if a file is loaded with ```load``` a lister is created using ```fs.watch``` to monitor for file-system change events. If the listener callback fires, then the modified file is automatically reimported. A console info message will indicate these updates. Console warnings for overwritting variable names will also show up for automatically re-imported files as well.
