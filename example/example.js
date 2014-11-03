// Example pony-config consumer


var config = require('../index.js');
config.options = { debug: true };
config.environmentSearch( { paths:['./example-env-file'], env: 'ENVIRONMENT', default:'prod', debug: true} );

config.list();

console.log('Done.');