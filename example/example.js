// Example pony-config consumer


var config = require('../index.js');

console.log('');
console.log( 'Demonstrating loading configuration');

config
    .setOptions( { debug: true } )
    .environmentSearch( { paths:['./example-env-file'], env: 'ENVIRONMENT', default:'prod', debug: true} )
    .useObject( {'organization': 'PonyCode' } )
    .useFile( 'example-config.json', ['dev'] )
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