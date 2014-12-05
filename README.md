pony-config
==============

A very small config module, and an easy replacement for most of nconf

## Versatile Configuration

### Configuration can be loaded from several sources
- JSON files
- Javascript Objects
- Environment Variables

### Sources are merged predictably
- Later values replace earlier values
- New properties extend objects

This makes it easy to set defaults, then load common configuration, and finally override with specific values.

### Objects are accessed through dot paths
Both `get` and `set` methods support dot paths.

### Selectable Configuration for Run-Time Environment

Configuration can be selected at load time for different environments, for example Poduction, Stage, Dev, etc.
Environment is determined by searching for file paths and environment variables.

For example,
```javascript
config.findEnvironment( { paths:['./env-file'], env: 'ENVIRONMENT', default:'prod');
```
## A Simple Example
```javascript
var config = require('pony-config');

config.useFile('settings.json');

var name = config.get('name');
var street = config.get('address.street');
config.set('verified', true);
```

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
config.set( 'name.first', "Michael" );      // will create or modify { name : { first : "Michael" } } as needed
config.set( 'name', { first : "Michael" );  // same as above, creating sub-paths as needed, extending existing sub-paths
```

## Load a Configuration Source

Configuration sources are loaded via the `use` functions.  As configuration sources are loaded, they replace or extend
previously loaded values.

####useObject( *object* )
This is useful for creating a default configuration.  The object will be loaded at the root of the configuration.

```javascript
config.useObject({
    name : 'anonymous',             // accessed as config.get('name')
    rank : 'beginner',
    settings : {                    // Nested objects
        bgcolor : 'red',
        fgcolor : 'white'           // accessed as config.get('settings.fgcolor')
    }
});
```

####useFile( *filepath* )

Configuration files are JSON files, and their contents are loaded to the root config object.
If the file doesn't exist it will be ignored.


####useEnvironmentVar( *path*, *variable name* );

Variables from process.env can be accessed by name, and stored using the dot path.

```javascript
config.useEnvironmentVar( 'settings.server.port', 'PORT');
```

## Run-time Environment Configuation
Often it's necessary to load a different configuration for different run-time environments.

- Determine the Environment
- Set the **pony-config** environment key
- Indicate which configuration sources are to be loaded for which environments

Configuration sources that aren't needed for the current environment are ignored.

####useEnvironment( *key* )
Once the environment has been determined, and *before* loading any configuration sources, call useEnvironment.  By default, no environment is selected.
```javascript
config.useEnvironment('prod');
```

####getEnvironment()
Returns for the current environment key.

####when( *key* | *[keys]* )
Use the *when* clause to indicate which environments should load the source.  In other environments, the source will be ignored. If no **when** clause is used, the source will be loaded (the default is **always**).  A **when** clause is in effect until a **use** method is applied.

```javascript
config.when('prod').useFile('productionConfig.json');
config.when(['prod','stage']).useObject({ database : 'mongodb' });
```

####always()
Always load the configuration source.  This is the default, but it is sometimes helpful to be explicit. 

## Determing the Run-time Environment
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

## Debugging
####list()
Outputs the current configuraion to console.log

####setOptions({ debug: true });
Turns on additional logging




