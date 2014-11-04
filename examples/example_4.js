var config = require('../index.js');

config.setOptions( { debug: true } );
config.findEnvironment( { paths:['./example-env-file'], env: 'ENVIRONMENT', default:'prod', debug: true} );

config.useObject({ 'organization': 'PonyCode' });
config.when(['dev']).useFile( 'example-dev-config.json' );
config.when(['prod','stage']).useFile( 'example-prod-config.json' );
config.list();
