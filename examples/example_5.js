var config = require('../index.js');

function dynamicConfig(){
	return {
		// It's like JSON with comments!
		dynamic : true,

		// Construct config values from other config values
		zipLookupUrl: 'http://zipsearch/' + config.get('zip'),
		versionString: 'You are running version ' + config.get('version'),
		compose_output_file : '~/tmp/' + config.get('outputFilename','output.txt'),

		// Use command line arguments to control values
		exclusionSet : ( config.get('exclusion') ) ? ['a','b','c','d' ] : [],
	};
}

console.log( 'Demonstrating dynamic configuration objects');

config
	.set('dynamic_is_fun', true )
	.useCommandLineArguments( [
		{ path:'zip', options:['zip','zipcode'] },
		{ path:'version', options:['v', 'version'] },
		{ path:'exclusion', options:'x' },
		{ path:'outputFilename', options:'o' }
	])
	.set('account.secret_key', 'p&ssw0rd')
	.useObject( dynamicConfig(), "Dynamic" )				// build configuration objects from config values
	.list( { secure: 'account.secret_key' });

console.log('Done.');