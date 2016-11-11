#pony-config

A very small config module

---

## Versatile, Predictable Configuration
### Configuration can be loaded from several sources
- JSON files
- Javascript Objects
- Environment Variables
- Commandline Arguments
- Programmatically

### Sources are merged predictably
- Later values replace earlier values
- New properties can extend objects
- Objects are merged recursively
- Powerful debug trace of each config value's source

This makes it easy to set defaults, then load common configuration, and finally override with specific values.

### Objects are accessed through dot paths
Both `get` and `set` methods support dot paths, for example ```get('name.first')```

### Selectable Configuration for Run-Time Environment

Configuration can be selected at run-time for each of your environments, for example Production, Stage, Dev, Dev-Josh, Dev-Scott.
The run-time environment is determined by searching file paths and environment variables.

For example,
```javascript
config.findEnvironment( { paths:['./env-file'], env: 'ENVIRONMENT', default:'prod');
```

### A Simple Example
```javascript
var config = require('pony-config');

config.useFile('common-config.json');
config.useFile('local-config.json');

var name = config.get('name');
var street = config.get('address.street');
config.set('verified', true);
```
	
---
# Getting Started

The config module is a singleton.  Reference it with
```javascript
var config = require('pony-config');
```

In your main javascript file, load the configuration once, then access it from anywhere else in your project.
## Accessors

Configuration properties are stored in nested objects, accessible through dot paths.
###get( *path*, *[default value]* )

```javascript
config.get( 'name.first', 'anonymous');
```
###set( *path*, *value* )
Configuration properties can be set.  If a property doesn't exist, the path to that property will be constructed as needed
```javascript
config.set( "name.first", "Michael" );      // will create or modify { name : { first : "Michael" } } as needed
config.set( "name", { first : "Michael" );  // same as above, creating sub-paths as needed, extending existing sub-paths
```

## Load a Configuration Source

Configuration sources are loaded via the `use` functions.  As configuration sources are loaded, they replace or extend
previously loaded values.

###useObject( *object* )
This is useful for creating a default configuration.  The object will be loaded at the root of the configuration.

```javascript
config.useObject({
    name : "anonymous",         // accessed as config.get("name")
    rank : "beginner",
    settings : {                // Nested objects
        bgcolor : "red",
        fgcolor : "white"       // accessed as config.get("settings.fgcolor")
    }
});
```

###useFile( *filepath* )

Configuration files are JSON files, and their contents are loaded to the root config object.
If the file doesn't exist it will be ignored.


###useEnvironmentVar( *path*, *variable name* )

Variables from process.env can be accessed by name, and stored using the dot path.
If the environmnet variable isn't found, the config is unchanged.

```javascript
config.useEnvironmentVar( "settings.server.port", "PORT");
var port = config.get( "settings,server.port" );
```

###useCommandlineArguments( *usageRule* | [*usageRules*] )

Configuration values can be loaded from the command line. Arguments are parsed from process.argv by [minimist.js](https://www.npmjs.com/package/minimist), and values are added at dot-paths in the configuration. CLI *usageRules* are defined similarly to many commandline processing tools.

***usageRule*** = { paths: *dotPath*, options: *optionFlags* | [*optionFlags*] }

For example, if your program's options are **-f|--file filename, -a|--appendmode, -s**,
then the following will load 'hamster.jpg' at 'outputs.binaryFilename', and true at 'settings.appendMode'.  Any expected argument that is not found will be ignored.

```bash
funnyprogram -f hamster.jpg -a
```
```javascript
config.useCommandlineArguments( [
    { path : "outputs.binaryFilename", options : ["f","file"] },
    { path : "settings.appendMode", options : ["a","appendMode"] },
    { path : "settings.silentMode", options : "s" }
]);
```

An alternative way to utilize command line arguments with pony-config is to call ```parseCommandlineArguments( *usageRules* )```, which will interpret the command line arguments
without committing them to the configuration. Then you can use ```getCommandlineValue( *path* )``` to access the values that were passed on the command line.

## Locking Config Against Changes
Once the configuration is set, you can lock it against further changes.  Pass *true* to have change attempts throw an exception, or set { 'exceptionOnLocked' : true } in your config options.
Once locked, all calls to set() or use...() will do nothing (or throw an exception if exceptionOnLocked is true).

In development and testing, it's probably best to throw an exception as these are programming errors.  For example, the following code snippet only sets
exceptionOnLocked while the environment is _dev_.

```javascript
config.lock( config.getEnvironment() === 'dev'  );
```

If require further protection from mutations of the config, use setOptions( { 'cloneWhenLocked' : true }. All of your get() methods will return clones of
config objects (with the exception of functions, which are returned without cloning so that internal state is preserved).

Cloning comes with the cost of memory and cloning-time for each request, so consider the real risk and likelihood of mutations in your code before using *cloneWhenLocked*.

---

## Merging Configuration Sources
Each configuration source is loaded at the config root. When another node is added
with an identical key path, it is merged with the previous node at that location. You can apply increasingly specific configurations at any depth

For example,
```javascript
config.useObject( { name : { first : "Mike" , last : "Moneybags" }}, age : 10 );
config.useObject( { name : { nickname : "Buckaroo" }, gender : "male" } );
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

---

## Run-time Environment Configuration

Often it's necessary to load a slightly different configuration for each of your run-time environments. **pony-config** does this in two steps.

- Tell **pony-config** how to determine the run-time environment
- Indicate which configuration sources are to be loaded for which environments

Configuration sources that aren't needed for the current environment are ignored, so you can declare all of your configuration sources in your main script file and let **pony-config** apply the right ones at run-time.

### Determining the Run-time Environment
**pony-config** can determine the run-time environment by searching for two kinds of environment determinants: files and environment variables. Environment variables are available on most platforms, and file determinants are provided for platforms that lack configurable environments or shells.

File Determinants are text files containing a string that will be the key.  For example, a file named ".env-file' may contain the string 'prod'.

###findEnvironment( *options* )
1. Looks in options.**var** for the name of an environment variable.
2. If the environment variable exists, uses its value as the key and exits
3. Looks in options.**path** for a file path, or an array of file paths.
4. Looks for a file at each path, in order.
5. If the file exists, uses its contents as the key and exits
6. Looks in options.**default** for a value.
7. If it is set, uses its value as the key and exits
8. If no environment key is found, returns false, and the *pony-config* continues as though no environment were set

If options.**debug**=true, the search will be logged to console.log

Path may include **~** to represent user home directory

Example
```javascript
config.findEnvironment( { paths:['~/.env', './env-file'], env: 'ENVIRONMENT', default:'prod');
```

### Declare Which Configurations to Apply

*NOTE:* Environments are case insensitive unless 
###when( *key* | *[keys]* )
Use the *when* clause to indicate which environments should load the source.  In any other environment, the source will be ignored. If no **when** clause is used, the source will be loaded in every environment.  A **when** clause is in effect until a **use** method is applied.

```javascript
config.when('prod').useFile('productionConfig.json');
config.when(['prod','stage']).useObject({ database : 'mongodb' });
```

###always()
Always load the configuration source.  This is the default, but it is sometimes helpful to be explicit.

```javascript
config.always().useFile( 'common.json' });
```

###useEnvironment( *key* )
If you have another way to determine your run-time environment, you can set the environment key directly.  You must set the environment **before** calling any *use* configuration functions.

```javascript
config.useEnvironment('prod');
```

###getEnvironment()
Returns the current environment key.  Returns ```false``` is no environment key has been set.

---

## Debugging
###list( options )

options are:
    noColor = true | false            turns on color logging (default is false)
    maxListDepth                      number of levels of config to list (default is 8, minimum 0)
    maxListValueLength                length of values to output, truncated if longer (default is 80)
    outputStream                      an object to be called instead of console.log for the output
    o.secure						  array of keyPaths.  values at each keyPaths will be logged as "****"
    caseSensitiveEnvironments         compare environments with case sensitivity, thus dev != 'DEV', default is false
                                      *note* in pony-config 1.0.x, the default behavior was case sensitivity

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

###reset()
Used in tests, reset clears the Config for reusing an object

###setOptions( o );
Turns on additional logging. Useful for tracing the loading of configuration files and environment search.

    o.debug = true | false              turns on logging (default is false)
    o.noColor = true | false            turns on color logging (default is false)
    o.cloneWhenLocked = true | false    turns on cloning for get() when locked (defaults false)
    o.exceptionOnLocked = true | false  throw exception set or use called wheh locked (default is false)
    o.customCommandlineArguments        argument string to use instead of process.argv (eg, "-v 1.04 -print -out file")


###See Also
**pony-config** uses
- [minimist](https://www.npmjs.com/package/minimist) for command line argument parsing because it does exactly one thing and does it well.
- [fs-coalesce](https://www.npmjs.com/package/fs-coalesce) to search file paths. This module (also by [ponycode](https://www.npmjs.com/~ponycode)) extends the file path syntax to include '~', and automatically matches on the first extant file in an array of paths.

### Tests

```npm test``` or ```grunt test```

### Test Coverage (via istanbul.js)
Statements   : 94.83% ( 330/348 )
Branches     : 83.94% ( 162/193 )
Functions    : 100% ( 41/41 )
Lines        : 97.46% ( 307/315 )

### License
Copyright (c) 2014 PonyCode Corporation Licensed under the MIT license.
