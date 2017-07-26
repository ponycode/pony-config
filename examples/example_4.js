var config = require('../index.js');

config.options( { debug: true } );

config.findRuntimeEnvironment( { paths:['~/test-pony-config-env','./example-env-file'], env: 'ENVIRONMENT', default:'prod', debug: true} );

config.object({ 'organization': 'PonyCode' });
config.when(['dev']).file( 'example-dev-config.json' );
config.when(['prod','stage']).file( 'example-prod-config.json' );
config.when('dev').
cliFlag( 'address.zip','zip, zipcode')
.cliParse();

config.set('address.zip-state', config.get('address.zip')+'-'+config.get('address.state'));
config.set('occupants', ['Scott','Steve','Stacy', ["Mother","Father"]] );
config.set('token', new Buffer("secretToken") );
config.set('date', new Date() );
config.set('fn', function( x ){ return x+1; } );

config.list( { maxListValueLength : 20 } );

