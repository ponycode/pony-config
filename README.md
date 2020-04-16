# pony-config

[![Build Status](https://travis-ci.org/ponycode/pony-config.svg?branch=master)](https://travis-ci.org/ponycode/pony-config)
[![Coverage Status](https://coveralls.io/repos/github/ponycode/pony-config/badge.svg?branch=master)](https://coveralls.io/github/ponycode/pony-config?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/ponycode/pony-config/badge.svg)](https://snyk.io/test/github/ponycode/pony-config)

Versatile, Predictable Configuration

```js
config.get('best.configuration.library')
```

#### Configuration can be combined from many sources
- JSON files
- Command Line Arguments
- Javascript Objects
- Environment Variables
- Programmatically

#### Configuration sources are merged predictably
- Config properties are extended and replaced recursively
- Powerful debug trace of each config value's source
- Makes it easy to set defaults, load common configurations, and override with environment specific config.

#### Configuration is easily accessed through dot paths
Both `get` and `set` methods support dot paths, for example `get('name.first')`

#### Different Configuration for each Run-Time Environment

Configuration can be selected at run-time for each of your environments, 
for example Production, Stage, Dev, Dev-Josh, Dev-Scott.

The run-time environment is determined by searching file paths and environment variables.

```javascript
config.findRuntimeEnvironment({
    paths:['./env-file'],
    env: 'ENVIRONMENT',
    default:'prod');
```

## Sources can be applied in layers

```javascript
var config = require('pony-config');

config
.file('common-config.json')                 // common for all environments
.when('test').file('local-config.json');    // test only configuration
```

> See more examples [here](./examples).

## Getting Started

`npm install --save pony-config`

The config module is a singleton. Set up your configuration in your main file at startup, access it everywhere in your project.

`var config = require('pony-config');`

See the [api documentation](docs/API.md) for the full **pony-config** API documentation.

## Debugging

**pony-conifg** provides several tools to help you debug your configuration. See 
the [debugging documentation](docs/DEBUG_API.md) for the debug API.

## Secure Keys

> Always store key files outside of your repo

In production, keys are often served to applications through environment variables,
while locally keys live on the file system. To keep keys safe, store them outside your repo,
for example, in `~/keys/` and use *pony-config* to load the appropriate key.

```js
config
    .when('dev').file('~/keys/secret.key')
    .when('prod').env( 'secret', 'SECRET_API_KEY')
```
 
### See Also
**pony-config** uses
- [minimist](https://www.npmjs.com/package/minimist) for command line argument parsing because it does exactly one thing and does it well.
- [fs-coalesce](https://www.npmjs.com/package/fs-coalesce) to search file paths. This module (also by [ponycode](https://www.npmjs.com/~ponycode)) extends the file path syntax to include '~', and automatically matches on the first extant file in an array of paths.

### Tests

`npm test`

For coverage, run `npm run coverage`

-------------------------------------------------------------------------
### License
Copyright (c) 2014,2020 PonyCode Corporation Licensed under the MIT license.
