# pony-config

[![Build Status](https://travis-ci.org/ponycode/pony-config.svg?branch=master)](https://travis-ci.org/ponycode/pony-config)
[![Coverage Status](https://coveralls.io/repos/github/ponycode/pony-config/badge.svg?branch=master)](https://coveralls.io/github/ponycode/pony-config?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/ponycode/pony-config/badge.svg)](https://snyk.io/test/github/ponycode/pony-config)
_Tested on OSX, linux, and Windows 10_

> Ver 2.0.2 accidentally introduced breaking API changes. Use version 3 for the latest API.

Versatile, Predictable Configuration

#### Sources are merged predictably
- Config propertes are extended and replaced recursively
- Powerful debug trace of each config value's source
- Makes it easy to set defaults, load common configurations, and override with environment specific config.

#### Configuration can be combined from many sources
- JSON files
- Command Line Arguments
- Javascript Objects
- Environment Variables
- Programmatically

## Table of Contents

- [Getting Started](#getting-started)
- [Full API](#api)
- [Getting Config from the Command Line](./docs/CLI_API_README.md)
- [Debugging](./doc/DEBUGGING.md))
- [Full API](./docs/API_README.md)
- [Examples](./examples)

## What you need to know

#### Configuration is easily accessed through dot paths
Both `get` and `set` methods support dot paths, for example ```get('name.first')```

#### Select Configuration for each Run-Time Environment

Configuration can be selected at run-time for each of your environments, for example Production, Stage, Dev, Dev-Josh, Dev-Scott.
The run-time environment is determined by searching file paths and environment variables.

```javascript
config.findRuntimeEnvironment({
    paths:['./env-file'],
    env: 'ENVIRONMENT',
    default:'prod');
```

## An Example: Combining Sources

```javascript
var config = require('pony-config');

config
.file('common-config.json')
.when('test').file('local-config.json');

var name = config.get('name');
var street = config.get('address.street');
config.set('verified', true);
```

> See more examples [here](./examples).

## Getting Started

`npm install --save pony-config`

The config module is a singleton. Set up your configuration in your main file at startup, access it everywhere in your project.

`var config = require('pony-config');`


## API

See the [api documentation](./docs/API_README.md) for the full **pony-config** API documentation.

## Getting Config from the Command Line

Configuration can be applied from the command line and combined with the rest of your config.

**Example**

`funnyprogram -w 650 -a -- hamster.jpg`

```javascript
config
.cliFlag( "settings.width", "-w, --width [pixels]", "resize image to fit width in pixels" },
.cliFlag( "settings.appendMode", "-a, --append", "run program in append mode" },
.cliFlag( "silentMode", "-s, --silent", "run program in silent mode" },
.cliArguments( "inputs.files" )
.cliParse()
```

See the [CLI API](./docs/CLI_API_README.md) for more.

## Debugging

**pony-conifg** provides several tools to help you debug your configuration. See 
the [debugging documentation](./docs/DEBUGGING_README.md) for the debug API.


### See Also
**pony-config** uses
- [minimist](https://www.npmjs.com/package/minimist) for command line argument parsing because it does exactly one thing and does it well.
- [fs-coalesce](https://www.npmjs.com/package/fs-coalesce) to search file paths. This module (also by [ponycode](https://www.npmjs.com/~ponycode)) extends the file path syntax to include '~', and automatically matches on the first extant file in an array of paths.

### Tests

`npm test` or `grunt test`

For coverage, run `npm run coverage`

-------------------------------------------------------------------------
### License
Copyright (c) 2014 PonyCode Corporation Licensed under the MIT license.
