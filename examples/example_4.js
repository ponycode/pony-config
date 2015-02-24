var config = require('../index.js');

config.setOptions( { debug: true } );
config.findEnvironment( { paths:['./example-env-file'], env: 'ENVIRONMENT', default:'prod', debug: true} );

config.useObject({ 'organization': 'PonyCode' });
config.when(['dev']).useFile( 'example-dev-config.json' );
config.when(['prod','stage']).useFile( 'example-prod-config.json' );
config.when('dev').useCommandLineArguments({ path:'address.zip', options:'zip' });

config.set('address.zip-state', config.get('address.zip')+'-'+config.get('address.state'));

config.get('address.zip');

config.list();
config.lock( true );

config.set("test",false);
