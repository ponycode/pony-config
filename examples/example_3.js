var config = require('../index.js');

console.log('');
console.log( 'Demonstrating no loaded configuration');

console.log('');
console.log( 'Demonstrating reading and writing configuration ');

console.log("config.get('address', 'unset'):", config.get('address', 'unset') );
console.log("config.set('address.state', 'TX' )");
config.set('address.state', 'TX' );
console.log("config.get('address', 'unset'):", config.get('address', 'unset') );


console.log('');
console.log('Done.');