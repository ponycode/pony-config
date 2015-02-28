var config = require('../index.js');

config.setOptions( { debug: true } );

config.findEnvironment( { paths:['~/test-pony-config-env','./example-env-file'], env: 'ENVIRONMENT', default:'prod', debug: true} );

config.useObject({ 'organization': 'PonyCode' });
config.when(['dev']).useFile( 'example-dev-config.json' );
config.when(['prod','stage']).useFile( 'example-prod-config.json' );
config.when('dev').useCommandLineArguments({ path:'address.zip', options:['zip','zipcode'] });

config.set('address.zip-state', config.get('address.zip')+'-'+config.get('address.state'));
config.set('occupants', ['Scott','Steve','Stacy', ["Mother","Father"]] );
config.set('token', new Buffer("secretToken") );
config.set('date', new Date() );
config.set('fn', function( x ){ return x+1; } );

config.list();

