// Example of new cli api

var config = require('../index.js');

config
.cliFlag( 'address.zip', 		'--zip [zipcode]', 'customer address zipcode' )
.cliFlag( 'version', 			'-v, --version', 'returns the version of this program' )
.cliFlag( 'exclusion', 		'-x [customerid]', 'exclude this customer from lists', false )
.cliFlag( 'output.filepath', 	'-o [outfilepath]', 'The output file to write' )
.cliFlag( 'default', 			'-d [value]', 'Default value to use', 'a-default' )
.cliFlag( 'json', 			'-j, --json [jsonString]', 'A json file input',  JSON.parse )
.cliArguments( 'arguments' )
.cliUsage( "[flags] [-j json] -- filename..." )
.cliOnHelp( function( help ){
	console.log( help );
	console.log( "Notes:");
	console.log( "   Accepts any number of filenames" );
	console.log( "   json body must be quoted and escaped" );
	process.exit(0);
})
.cliParse();

if( config.get('help')){
	config.cliHelp();
	process.exit(0);
}

config.list();

console.log('Done.');