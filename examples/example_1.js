// Example pony-config consumer


var config = require('../index.js');

console.log('');
console.log( 'Demonstrating loading configuration');

config
    .options( { debug: true } )
    .findRuntimeEnvironment( { paths:['./example-env-file'], env: 'ENVIRONMENT', default:'prod', debug: true} )
    .always().object( {'organization': 'PonyCode' } )
    .when(['dev']).file( 'example-dev-config.json' )
    .when(['prod','stage'])
        .file( 'example-prod-config.json' )
        .object( { productionKey: 'pkey' })
    .list();

console.log('');
console.log( 'Demonstrating reading and writing configuration ');

console.log('Initial State:', config.get('address.state', 'unset') );
config.set('address.state', 'TX' );
console.log('New State:', config.get('address.state', 'unset') );

console.log('');
console.log('New Address:', config.get('address') );

console.log('');
console.log('Done.');