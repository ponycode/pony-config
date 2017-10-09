# API Documentation

## In This Document
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
- [Overview](#overview)
- [Applying Configuration Sources](#applying-configuration-sources)
    - [object( *object* )](#object-object-)
    - [file( *filepath* )](#file-filepath-)
    - [env( *path*, *variable name* )](#env-path-variable-name-)
- [Command Line API](#command-line-api)
    - [cliFlag( *path*, *flags*, *description*, *[default value]*, *[opt_parser]* )`](#cliflag-path-flags-description-default-value-opt_parser-)
    - [cliArguments( *path* )](#cliarguments-path-)
    - [cliParse()](#cliparse)
    - [cliUsage( *message* )](#cliusage-message-)
    - [cliOnHelp( *function* )](#clionhelp-function-)
    - [cliHelpMessage()](#clihelpmessage)
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
- [Locking Config Against Changes](#locking-config-against-changes)
    - [lock( *boolean* )](#lock-boolean-)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

### Overview

In your main file, setup your configuration by combining sources.

1. Determine the runtime environment
2. Load defaults from files and objects
3. Override defaults with runtime specific files and objects
4. Apply overrides and additional configuration from the command line

In your code, `require('pony-config')` and use the resolved configuration with `get()`.

## Applying Configuration Sources

Configuration sources are applied via the following functions. As configuration
sources are applied, new values will replace or extend previously applied
values at the same key paths.

Application of each configuration source can be conditional on the run time environemnt.
See the

#### object( *object* )
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

#### file( *filepath* )

Applies the contents of a `JSON` file found at the filepath. If the file
doesn't exist the config is unchanged. If the file is unreadable
(or not JSON), the config will not be changed.


#### env( *path*, *variable name* )

Variables from `process.env` can be accessed by name, and their contents stored at the given key path.
If the environmnet variable isn't found, the config is unchanged.

```javascript
config.env( "settings.server.port", "PORT");
var port = config.get( "settings.server.port" );
```

## Command Line API

See [Command Line API](CLI_API_README.md) for the full API.

#### cliFlag( *path*, *flags*, *description*, *[default value]*, *[opt_parser]* )`

Declare the command line flags and how they should be stored.

#### cliArguments( *path* )

Declare where to store an arguments list.

#### cliParse()

Parse the command line.

#### cliUsage( *message* )

Contribute a usage method to the auto-generated help.

#### cliOnHelp( *function* )

Provide a handler for contributing more complex functionality to the online help.

#### cliHelpMessage()

Override the auto generated help with your own message.


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

## Locking Config Against Changes

#### lock( *boolean* )

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

