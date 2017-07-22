// Example of new cli api

var config = require('../index.js');

config
.cliOption( 'zip', '--zip, --zipcode', 'customerZipCode' )
.cliOption( 'version', ['-v', '--version'], 'returns the version of this program' )
.cliOption( 'exclusion', '-x', 'exclude this customer from lists', false )
.cliOption( 'output.filepath', '-o', 'The output file to write' )
.cliOption( 'default', '-d', 'Default value to use', 'a-default' )
.cliOption( 'json', ['-j','--json'], 'A json file input',  JSON.parse )
.cliArguments( 'arguments' )
.cliParse();

if( config.get('help')){
	config.cliHelp();
	process.exit(0);
}

config.list();

console.log('Done.');