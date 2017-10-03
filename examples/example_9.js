// Example of new cli api with stdin

var config = require('../index.js');

function toUpperCase( s ){
	return String(s).toUpperCase();
}

config
.cliStdin( 'data', '-d, --data [text]', 'A text string to process', toUpperCase )
.cliParse();

config.list();

console.log('Done.');
