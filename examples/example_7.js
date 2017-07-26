// Example of new config from a module

var config = require('../index.js');
var path = require('path');

config.require( path.resolve( "./a-module" ))
.list();