# pony-config

[![Build Status](https://travis-ci.org/ponycode/pony-config.svg?branch=master)](https://travis-ci.org/ponycode/pony-config)
[![Coverage Status](https://coveralls.io/repos/github/ponycode/pony-config/badge.svg?branch=master)](https://coveralls.io/github/ponycode/pony-config?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/ponycode/pony-config/badge.svg)](https://snyk.io/test/github/ponycode/pony-config)

> Ver 2.0.2 accidentally introduced breaking API changes. Use Ver 3.x.x for the latest API.

Versatile, Predictable Configuration

#### Sources are merged predictably
- Config propertes are extended and replaced recursively
- Powerful debug trace of each config value's source
- Makes it easy to set defaults, load common configurations, and override with environment specific config.

#### Configuration can be combined from many sources
- JSON files
- Javascript Objects
- Environment Variables
- Command Line Arguments
- Programmatically

#### Configuration properties are easily accessed through dot paths
Both `get` and `set` methods support dot paths, for example ```get('name.first')```

#### Select Configuration for each Run-Time Environment

Configuration can be selected at run-time for each of your environments, for example Production, Stage, Dev, Dev-Josh, Dev-Scott.
The run-time environment is determined by searching file paths and environment variables.

```javascript
config.findRuntimeEnvironment( { paths:['./env-file'], env: 'ENVIRONMENT', default:'prod');
```

## A Simple Example
```javascript
var config = require('pony-config');

config.file('common-config.json');
config.file('local-config.json');

var name = config.get('name');
var street = config.get('address.street');
config.set('verified', true);
```
	
	
## In This Document
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Getting Started](#getting-started)
- [Accessors](#accessors)
  - [get( *path*, *[default value]* )](#get-path-default-value-)
  - [set( *path*, *value* )](#set-path-value-)
- [Applying Configurations](#applying-configurations)
  - [object( *object* )](#object-object-)
  - [file( *filepath* )](#file-filepath-)
  - [env( *path*, *variable name* )](#env-path-variable-name-)
- [Command Line Interfaces](#command-line-interfaces)
  - [cliFlag( *path*, *flags*, *description*, *[default value]*, *[opt_parser]* )`](#cliflag-path-flags-description-default-value-opt_parser-)
  - [cliArguments( *path* )](#cliarguments-path-)
  - [cliParse()](#cliparse)
  - [Command Line Help](#command-line-help)
    - [cliUsage( *message* )](#cliusage-message-)
    - [cliOnHelp( *function* )](#clionhelp-function-)
    - [cliHelpMessage()](#clihelpmessage)
- [Locking Config Against Changes](#locking-config-against-changes)
- [Merging Configuration Sources](#merging-configuration-sources)
- [Run-time Environment Configuration](#run-time-environment-configuration)
  - [Determining the Run-time Environment](#determining-the-run-time-environment)
    - [findRuntimeEnvironment( *options* )](#findruntimeenvironment-options-)
    - [useRuntimeEnvironment( *key* )](#useruntimeenvironment-key-)
    - [isRuntimeEnvironment( *environment* )](#isruntimeenvironment-environment-)
    - [getRuntimeEnvironment()](#getruntimeenvironment)
  - [Selectively Applying Configurations](#selectively-applying-configurations)
    - [when( *key* | *[keys]* )](#when-key--keys-)
    - [always()](#always)
- [Debugging](#debugging)
  - [list( options )](#list-options-)
  - [reset()](#reset)
  - [options( *o* )](#options-o-)
  - [cliParse( **optional arguments string** )](#cliparse-optional-arguments-string-)
  - [See Also](#see-also)
  - [Tests](#tests)
  - [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Getting Started

The config module is a singleton.  Reference it with
```javascript
var config = require('pony-config');
```

In your main javascript file, load the configuration once, then access it from anywhere else in your project.
## Accessors

Configuration properties are stored in nested objects, accessible through dot paths.
### get( *path*, *[default value]* )

```javascript
config.get( 'name.first', 'anonymous');
```
### set( *path*, *value* )
Configuration properties can be set.  If a property doesn't exist, the path to that property will be constructed as needed
```javascript
config.set( "name.first", "Michael" );      // will create or modify { name : { first : "Michael" } } as needed
config.set( "name", { first : "Michael" );  // same as above, creating sub-paths as needed, extending existing sub-paths
```

## Applying Configurations

Configuration sources are applied via the following functions. As configuration sources are applied, new values will replace or extend previously applied values at the same key paths.

### object( *object* )
Useful for creating a default configuration, the object will be applied at the root of the configuration.

```javascript
config.object({
    name : "anonymous",         // accessed as config.get("name")
    rank : "beginner",
    settings : {                // Nested objects
        bgcolor : "red",
        fgcolor : "white"       // accessed as config.get("settings.fgcolor")
    }
});
```

### file( *filepath* )

Applies the contents of a `JSON` file found at the filepath. If the file doesn't exist the config is unchanged.


### env( *path*, *variable name* )

Variables from process.env can be accessed by name, and their contents stored at the given key path.
If the environmnet variable isn't found, the config is unchanged.

```javascript
config.env( "settings.server.port", "PORT");
var port = config.get( "settings.server.port" );
```

## Command Line Interfaces

Configuration can be applied from the commandline and combined with the rest of your config.
Arguments are parsed from process.argv by [minimist.js](https://www.npmjs.com/package/minimist),
and values are added at dot-paths in the configuration.


- short and long options, with or without arguments eg. `-a, --append [filepath]`
- optionally provide a parser for arguments, eg. `--nums=1,2,3,4` -> `[1,2,3,4]`
- store command line arguments in the config
- supports varadic arguments at the end of the command line, e.g. `print --size=200 file1 file2`
- built in help flags, -h and --help

**Example**

`funnyprogram -w 650 -a -- hamster.jpg`

```javascript
config
.cliFlag( "settings.width", "-w, --width [1280]", "resize image to fit width in pixels", false },
.cliFlag( "settings.appendMode", "-a, --append", "run program in append mode", false },
.cliFlag( "outputs.silentMode", "-s, --silent", "run program in silent mode", false },
.cliArguments( "inputs.files" )
.cliUsage( "[flags] file..." )
.cliOnHelp( function( helpText ){
	console.log( helpText );
	console.log( "see mywebsite.com for more help" );
	process.exit(0);
})
.cliParse()
```


### cliFlag( *path*, *flags*, *description*, *[default value]*, *[opt_parser]* )`

- `path` is the config path to store the value
- `flags` is a comma separated list of the flags for this parameter
- `description` will be displayed in the help text
- `default` is the optional default value to store if the flag is not on the command line
- `parser` is an optional function to be called with the input before storing it in the config

If a parser is provided, it should accept a string and return the value to be
stored at `path`. Examples of common parsers are ParseInt, toLowerCase, splitList etc.

> Input of negative numbers is problematic on a command line, because the *dash* is first interpreted as a flag. This enables
> the use of numerals as flags (eg, -9). The safest way to accept negative input is to use an _equals_ as follows:
> `--value=-9`

### cliArguments( *path* )

Gathers all inputs after the last flag as an array at the given path.

> input parameters are always attached to the flag to the left of them. After a `--` on the command line
all inputs will be gathered into the arguments.


### cliParse()

Commandline parsing can be conditional on the runtime environment. For example `config.when('dev').cliParse()`.

`cliParse` must be called after all other cli configuration functions.

A help flag is defined for you as `-h, --help`. The flags, descriptions and defaults will be output to stdout.


### Command Line Help

Users expect `-h` or `--help` to provide help text for using your program. Help text will be generated for you from the flags and
descriptions provided with the *cliFlags* function.

When the user includes either `-h` or `--help` on the command line, the help text will be printed to stdout and the process will exit.

If you use both `-h` and `--help` flags for your own purposes, then you may want to provide an alternate means to display the help text.

Help text can be customized with the following methods.


#### cliUsage( *message* )

Add a message regarding usage. It will appear with the help text as "Usage: *command* **your message**".


#### cliOnHelp( *function* )

Provide your own help handler. *function* will receive the generated help text as input.

If you do not include an onHelp handler of your own, **pony-config** will log the help text
to `stdout` and call `process.exit(0)`.

#### cliHelpMessage()

Returns the generated help text.


## Locking Config Against Changes

Once the configuration is set, you can lock it against further changes.  Pass *true* to have change attempts throw an exception, or set { 'exceptionOnLocked' : true } in your config options.
Once locked, all attempts to apply or set config will do nothing (or throw an exception if exceptionOnLocked is true).

In development and testing, it's probably best to throw an exception as these are programming errors.  For example, the following code snippet only sets
exceptionOnLocked while the environment is _dev_.

```javascript
config.lock( config.getRuntimeEnvironment() === 'dev'  );
```

If require further protection from mutations of the config, use options( { 'cloneWhenLocked' : true }. All of your get() methods will return clones of
config objects (with the exception of functions, which are returned without cloning so that internal state is preserved).

Cloning comes with the cost of memory and cloning-time for each request, so consider the real risk and likelihood of mutations in your code before using *cloneWhenLocked*.



## Merging Configuration Sources

Each configuration source is applied at the config root. When another node is added
with an identical key path, it is merged with the previous node at that location. You can apply increasingly specific configurations at any depth

For example,
```javascript
config.object( { name : { first : "Mike" , last : "Moneybags" }}, age : 10 );
config.object( { name : { nickname : "Buckaroo" }, gender : "male" } );
```

Results in
```javascript
{
    name : {
        first : "Mike",             // from first source
        last : "Moneybags",         // from first source
        nickname : "Buckaroo" },    // extended from "name" node in second source
    age : 10,                       // from first source
    gender : male                   // extended by second source
}
```


## Run-time Environment Configuration

Often it's necessary to apply different configurations in each of your run-time environments.

1. Tell **pony-config** how to determine the run-time environment
2. Indicate which configuration sources are to be applied for which environments

Configuration sources that aren't needed for the current environment are ignored, so you can declare all of your configuration sources at the top of your app and let **pony-config** apply the right ones at run-time.

### Determining the Run-time Environment

**pony-config** can determine the run-time environment by searching for two kinds of environment determinants: files and environment variables. Environment variables are available on most platforms and are the most convenient. File determinants are provided for platforms that lack configurable environments variables or shells.

A file Determinant is simply a text file containing a string.  For example, a file named ".env-file' containing the string 'prod'.

#### findRuntimeEnvironment( *options* )

1. Looks in options.**var** for the name of an environment variable.
	a. If the environment variable exists, uses its value as the key and exits
2. Looks in options.**path** for a file path, or an array of file paths.
	a. Looks for a file at each path, in order.
	b. If the file exists, uses its contents as the key and exits
3. Looks in options.**default** for a value.
	a. If it is set, uses its value as the key and exits
	b. If no environment key is found, returns false, and the *pony-config* continues as though no environment were set

Include `options.debug=true` to log the search progress to through `console.log`.

> **pony-config** file paths may use **~** (tilde) to represent the users home directory.

Example
```javascript
config.findRuntimeEnvironment( { paths:['~/.env', './env-file'], env: 'ENVIRONMENT', default:'prod');
```

#### useRuntimeEnvironment( *key* )
If you have another way to determine your run-time environment, you can simply set the environment key directly.

```javascript
config.useRuntimeEnvironment('prod');
```

#### isRuntimeEnvironment( *environment* )
You can check the run-time environment that was resolved by **pony-config**. Takes into account case sensitivity options. The default
is case-insensitive comparison.

#### getRuntimeEnvironment()
Returns the current environment key. Returns ```false``` is no environment key has been set.


### Selectively Applying Configurations

> Environment keys are case-insensitive unless `config.options()` is called with `caseSensitiveEnvironments: false`.

#### when( *key* | *[keys]* )

Use the *when* clause to indicate which environments should apply the source.  In any other environment, the source will be ignored. If no **when** clause is used, the source will be applied in every environment.  A **when** clause is in effect only for the next apply function.

```javascript
config.when('prod').file('productionConfig.json');
config.when(['prod','stage']).object({ database : 'mongodb' });
```

#### always()

Always apply the configuration source. This is the default, but it is sometimes helpful to be explicit.

```javascript
config.always().file( 'common.json' });
```


## Debugging

### list( options )

options are:
    noColor = true | false            turns on color logging (default is false)
    maxListDepth                      number of levels of config to list (default is 8, minimum 0)
    maxListValueLength                length of values to output, truncated if longer (default is 80)
    outputStream                      an object to be called instead of console.log for the output
    o.secure						  array of keyPaths.  values at each keyPaths will be logged as "****"
    caseSensitiveEnvironments         compare environments with case sensitivity, thus dev != 'DEV', default is false
                                      *note* in pony-config 1.0.x, the default behavior was case sensitivity
    formatter                         optional function taking ( value, keyPath ) and returning value, possibly modified (eg, converted to hex)

Outputs the current configuration, including the final configuration source of each key value.
This is extremely useful for debugging configuration merges from multiple sources.
Output will be sent to console.log, unless outputStream option is set, in which case outputStream() is called in place of console.log().
The output looks like:

```
    CONFIG: [dev] [LOCKED]
    organization : PonyCode  [USE-OBJECT]
    name : Harry Chesterson  [USE-FILE:example-dev-config.json]
    address :  [USE-FILE:example-dev-config.json]
    |--street : 24 Merry Way
    |--zip : 49013  [USE-COMMAND-LINE:zip]
    |--state : CA
    |--zip-state : 49013-CA  [SET]
```

### reset()

Used in tests, reset clears the Config for reusing an object

### options( *o* )

Turns on additional logging. Useful for tracing the applying of configuration files and environment search.

    o.debug = true | false              turns on logging (default is false)
    o.noColor = true | false            turns on color logging (default is false)
    o.cloneWhenLocked = true | false    turns on cloning for get() when locked (defaults false)
    o.exceptionOnLocked = true | false  throw exception when change attempted when locked (default is false)

### cliParse( **optional arguments string** )

For debugging, you may pass a string of command line arguments to `cliParse`. Parsing
will continue as though this string were the arguments on the command line.

### See Also
**pony-config** uses
- [minimist](https://www.npmjs.com/package/minimist) for command line argument parsing because it does exactly one thing and does it well.
- [fs-coalesce](https://www.npmjs.com/package/fs-coalesce) to search file paths. This module (also by [ponycode](https://www.npmjs.com/~ponycode)) extends the file path syntax to include '~', and automatically matches on the first extant file in an array of paths.

### Tests

```npm test``` or ```grunt test```

For coverage, run `npm run cover`

-------------------------------------------------------------------------
### License
Copyright (c) 2014 PonyCode Corporation Licensed under the MIT license.
