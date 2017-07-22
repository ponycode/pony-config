// Example of new cli api

var config = require('../index.js');

config
.cliOption( 'address.zip', 		'--zip [zipcode]', 'customer address zipcode' )
.cliOption( 'version', 			'-v, --version', 'returns the version of this program' )
.cliOption( 'exclusion', 		'-x [customerid]', 'exclude this customer from lists', false )
.cliOption( 'output.filepath', 	'-o [outfilepath]', 'The output file to write' )
.cliOption( 'default', 			'-d [value]', 'Default value to use', 'a-default' )
.cliOption( 'json', '			s-j, --json [jsonString]', 'A json file input',  JSON.parse )
.cliArguments( 'arguments' )
.cliParse();

if( config.get('help')){
	config.cliHelp();
	process.exit(0);
}

config.list();

console.log('Done.');