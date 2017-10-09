// Example of new config from a module
// EXPERIMENTAL PRE-RELEASE
// DO NOT USE IN PRODUCTION CODE

var config = require('../index.js');
var path = require('path');

config.require( path.resolve( "./a-module" ))
.list();
