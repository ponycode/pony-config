
# Debugging API

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [list( options )](#list-options-)
- [reset()](#reset)
- [options( *o* )](#options-o-)
- [cliParse( *optional arguments string* )](#cliparse-optional-arguments-string-)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

### list( *options* )

Output the current configuration, including the final configuration source
of each resolved key & value. This is extremely useful for debugging configuration
merges from multiple sources.

Output will be sent to console.log, unless the _outputStream_ option is set, in which case outputStream() is called in place of console.log().

options are:
    noColor = true | false            turns on color logging (default is false)
    maxListDepth                      number of levels of config to list (default is 8, minimum 0)
    maxListValueLength                length of values to output, truncated if longer (default is 80)
    outputStream                      an object to be called instead of console.log for the output
    o.secure						  array of keyPaths.  values at each keyPaths will be logged as "****"
    caseSensitiveEnvironments         compare environments with case sensitivity, thus dev != 'DEV', default is false
                                      *note* in pony-config 1.0.x, the default behavior was case sensitivity
    formatter                         optional function taking ( value, keyPath ) and returning value, possibly modified (eg, converted to hex)

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

Used in tests; clears the configuration.

### options( *o* )

Turns on additional logging. Useful for tracing the applying of configuration files and environment search.

    o.debug = true | false              turns on logging (default is false)
    o.noColor = true | false            turns on color logging (default is false)
    o.cloneWhenLocked = true | false    turns on cloning for get() when locked (defaults false)
    o.exceptionOnLocked = true | false  throw exception when change attempted when locked (default is false)

### cliParse( *optional arguments string* )

For debugging command line parsing, you may pass a string of command line arguments to `cliParse`. Parsing
will continue as though this string were the arguments on the command line.
