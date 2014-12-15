#pony-config

A very small config module, and an easy replacement for most of nconf

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
- Powerfull debug trace of each config value's source

This makes it easy to set defaults, then load common configuration, and finally override with specific values.

### Objects are accessed through dot paths
Both `get` and `set` methods support dot paths, for example ```get('name.first')```

### Selectable Configuration for Run-Time Environment

Configuration can be selected at run-time for each of your environments, for example Poduction, Stage, Dev, Dev-Josh, Dev-Scott.
The run-time nvironment is determined by searching file paths and environment variables.

For example,
```javascript
config.findEnvironment( { paths:['./env-file'], env: 'ENVIRONMENT', default:'prod');
```
## A Simple Example
```javascript
var config = require('pony-config');

config.useFile('common-config.json');
config.useFile('local-config.json');

var name = config.get('name');
var street = config.get('address.street');
config.set('verified', true);
```
---
# Usage
## Instantiation

The config module is a singleton.  Instantiate it with
```javascript
var config = require('pony-config');
```

In your main javascript file, load the configuration once, then access it from anywhere else in your project.
## Accessors

Configuration properties are stored in nested objects, accesible through dot paths.
####get( *path*, *[default value]* )

```javascript
config.get( 'name.first', 'anonymous');
```
####set( *path*, *value* )
Configuration propeties can be set.  If a property doesn't exist, the path to that property will be constructed as needed
```javascript
config.set( "name.first", "Michael" );      // will create or modify { name : { first : "Michael" } } as needed
config.set( "name", { first : "Michael" );  // same as above, creating sub-paths as needed, extending existing sub-paths
```

## Load a Configuration Source

Configuration sources are loaded via the `use` functions.  As configuration sources are loaded, they replace or extend
previously loaded values.

####useObject( *object* )
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

####useFile( *filepath* )

Configuration files are JSON files, and their contents are loaded to the root config object.
If the file doesn't exist it will be ignored.


####useEnvironmentVar( *path*, *variable name* )

Variables from process.env can be accessed by name, and stored using the dot path.
If the environmnet variable isn't found, the config is unchanged.

```javascript
config.useEnvironmentVar( "settings.server.port", "PORT");
var port = config.get( "settings,server.port" );
```

####useCommandlineArgs( *usageRule* | [*usageRules*] )

Configuration values can be loaded from the command line. Arguments are parsed from process.argv by minimist.js, and value are saved at dot-paths in the configuration. CLI *usageRules* are defined similarly to many commandline processing tools.

***usageRule*** = { paths: *dotPath*, options: *optionFlags* | [*optionFlags*] }  

For example, if your program's options are **-f|--file filename, -a|--appendmode, -s**, 
then the following will load 'hamster.jpg' at 'outputs.binaryFilename', and true at 'settings.appendMode' with the following usageRules.  Any expected argument that is not found will be ignored.

```bash
funnyprogram -f hamster.jpg -a
```
```javascript
config.useCommandlineArgs( [
    { path : "outputs.binaryFilename", options : ["f","file"] },
    { path : "settings.appendMode", options : ["a","appendMode"] },
    { path : "settings.silentMode", options : "s" }
]);
```

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

## Run-time Environment Configuation

Often it's necessary to load a slightly different configuration for each of your run-time environments. **pony-config** does this in three steps.

- Tell **pony-config** how to determine the run-time environment
- Indicate which configuration sources are to be loaded for which environments

Configuration sources that aren't needed for the current environment are ignored, so you can declare all of your configuration sources in your main script file and let **pony-config** apply the right ones at run-time.

### Determing the Run-time Environment
**pony-config** can help you determine the runtime configuration by searching for two kinds of environment determinants: files and environment variables.  File determinants are provided for platforms that lack configurable environment variables.

File Determinants are text files containing a string that will be the key.  For example, a file named ".env-file' may contain the string 'prod'.

####findEnvironment( *options* )
1. Looks in options.**var** for an environment variable.
2. If the environment variable exists, uses its value as the key and exits
3. Looks in options.**path** for a file path, or an array of file paths.
4. Looks for a file at each path, in order.
5. If the file exists, uses its contents as the key and exits
6. Looks in options.**default** for a value.
7. If it is set, uses its value as the key and exits
8. If no environment key is found, returns false, and default behvior continues as though no environment were set

If options.**debug**=true, the search will be logged to console.log

Example
```javascript
config.findEnvironment( { paths:['./env-file'], env: 'ENVIRONMENT', default:'prod');
```

### Declare Which Configurations to Apply

####when( *key* | *[keys]* )
Use the *when* clause to indicate which environments should load the source.  In any other environment, the source will be ignored. If no **when** clause is used, the source will be loaded in every environment.  A **when** clause is in effect until a **use** method is applied.

```javascript
config.when('prod').useFile('productionConfig.json');
config.when(['prod','stage']).useObject({ database : 'mongodb' });
```

####always()
Always load the configuration source.  This is the default, but it is sometimes helpful to be explicit. 

```javascript
config.always().useFile( 'common.json' });
```

####useEnvironment( *key* )
If you have another way to determine your run-time environment, you can set the environment key directly.  You must set the environment **before** calling any *use* configuration functions.

```javascript
config.useEnvironment('prod');
```

####getEnvironment()
Returns for the current environment key.  Returns ```false``` is no environment key has been set.

---

## Debugging
####list()
Outputs the current configuraion to console.log, including the final configuration source of each key value. This is extremely usuful for debugging configuration merges from multiple sources.  The output looks like:

```
    CONFIG: [dev]
    organization : PonyCode  [USE-OBJECT]
    name : Harry Chesterson  [USE-FILE:example-dev-config.json]
    address :  [USE-FILE:example-dev-config.json]
    |--street : 24 Merry Way 
    |--zip : 49013  [USE-COMMAND-LINE:zip]
    |--state : CA 
    |--zip-state : 49013-CA  [SET]
```

####setOptions({ debug: true });
Turns on additional logging. Useful for tracing the loading of configuration files and environment search.

###See Also
**pony-config** uses [minimist](https://www.npmjs.com/package/minimist) for command line argument parsing because it does exactly one thing and does it well. 

###Coming Soon
The next version of **pony-config** will use [fs-coalesce](https://www.npmjs.com/package/fs-coalesce) to file paths. This module (also by [ponycode](https://www.npmjs.com/~ponycode)) extends the filepath syntax to include '~', and automatically matches on the first extant file in an array of paths.

###License
Copyright (c) 2014 PonyCode Corporation Licensed under the MIT license.
