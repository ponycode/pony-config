const assert = require("assert");

const proxyquire =  require('proxyquire').noCallThru();
var stdinReadSyncResponse = null;

proxyquire('../../index', { './lib/stdin': { readSync: function(){ return stdinReadSyncResponse }}});

const config = require('../../index');

beforeEach( function(){
	config.reset();
});

describe('cliConfig', function(){

	describe('option formats', function(){
		it('option with no dash works', function(){
			config.cliFlag( 'version', 'v' ).cliParse('-v version');
			assert.equal( 'version', config.get('version'), 'should be set');
		});

		it('option with dash works', function(){
			config.cliFlag( 'version', '-v' ).cliParse('-v version');
			assert.equal( 'version', config.get('version'), 'should be set');
		});

		it('option with short and long works using short', function(){
			config.cliFlag( 'version', '-v, --version' ).cliParse('-v version');
			assert.equal( 'version', config.get('version'), 'should be set');
		});

		it('option with short and long works using long', function(){
			config.cliFlag( 'version', '-v, --version' ).cliParse('--version version');
			assert.equal( 'version', config.get('version'), 'should be set');
		});

		it('option with array for backwards compatibility', function(){
			config.cliFlag( 'version', ['-v', '--version'] ).cliParse('--version version');
			assert.equal( 'version', config.get('version'), 'should be set');
		});

		it('option with extra whitespace works', function(){
			config.cliFlag( 'version', '   -v, 	--version\n\r' ).cliParse('--version version');
			assert.equal( 'version', config.get('version'), 'should be set');
		});

		it('accepts a parameter in option', function(){
			config.cliFlag( 'version', '-v, --version [a-version]' ).cliParse('--version version');
			assert.equal( 'version', config.get('version'), 'should be set');
		});
	});

	describe("Optional parameters", function(){

		function listParser( string ){
			return string.split(",");
		}

		it('option works all parameters', function(){
			config.cliFlag( 'names', '-n, --names [name,...]', 'list of names', false, listParser ).cliParse('--names joe,bob,tony');
			var list = config.get('names');
			assert.deepEqual( list, ['joe','bob','tony'] );
		});

		it('option works without optional default', function(){
			config.cliFlag( 'names', '-n, --names [name,...]', 'list of names', listParser ).cliParse('--names joe,bob,tony');
			var list = config.get('names');
			assert.deepEqual( list, ['joe','bob','tony'] );
		});
	});

	describe("Gathers arguments", function(){
		it('works without any options', function(){
			config.cliArguments( 'names' ).cliParse('joe bob tony');
			var list = config.get('names');
			assert.deepEqual( list, ['joe','bob','tony'] );
		});

		it('works with options when none included', function(){
			config.cliFlag( 'size', '-s, --size [meters]', 'size of it' );
			config.cliArguments( 'names' ).cliParse('joe bob tony');
			var list = config.get('names');
			assert.deepEqual( list, ['joe','bob','tony'] );
		});

		it('works with options when used', function(){
			config.cliFlag( 'size', '-s, --size [meters]', 'size of it' );
			config.cliArguments( 'names' ).cliParse('--size 11 joe bob tony');
			var list = config.get('names');
			assert.deepEqual( list, ['joe','bob','tony'] );
			assert.equal( 11, config.get('size'));
		});

		it('empty -- after all options marks beginning of arguments', function(){
			config.cliFlag( 'recurse', '-r', 'recurse if included' );
			config.cliArguments( 'names' ).cliParse('-r -- joe bob tony');
			var list = config.get('names');
			assert.deepEqual( list, ['joe','bob','tony'] );
			assert.equal( true, config.get('recurse'));
		});
	});

	describe("Help", function(){
		function collapseWhitespaceToOneSpace( s ){
			return s.split(/\s+/g).join(' ').trim();
		}

		it('generates empty help', function(){
			config.cliParse();
			var help = collapseWhitespaceToOneSpace( config.cliHelpMessage() );

			assert.equal( help, "Flags: -h, --help Show command help");
		});

		it('generate help with flags usage', function(){
			process.argv[1] = 'test';
			config.cliUsage("tests the cli");
			config.cliFlag('filename', '-f, --file [filename]', 'a file name', 'the_file' );
			config.cliArguments( 'arguments' );
			config.cliParse();

			var help = collapseWhitespaceToOneSpace( config.cliHelpMessage() );

			assert.equal( help, "Usage: test tests the cli Flags: -f, --file [filename] a file name, default: 'the_file' -h, --help Show command help");
		});

		it('calls onHelp handler when help present', function( done ){
			config.cliOnHelp( function( help ){
				var trimmed = collapseWhitespaceToOneSpace( help );
				assert.equal( trimmed, "Flags: -h, --help Show command help" );
				done();
			});
			config.cliParse('-h');
		});

		it('only adds help flag if user provides an h flag', function(){
			config.cliFlag('hungry_for','-h [snack]');
			config.cliParse();
			var help = collapseWhitespaceToOneSpace( config.cliHelpMessage() );
			assert.equal( help, "Flags: -h [snack] --help Show command help" );
		});

		it('only adds an h flag if user provides a help flag', function(){
			config.cliFlag('helpers','--help [servants]');
			config.cliParse();
			var help = collapseWhitespaceToOneSpace( config.cliHelpMessage() );
			assert.equal( help, "Flags: --help [servants] -h Show command help" );
		});

		it('excludes help if user provides both h and help flags', function(){
			config.cliFlag('helpers','-h, --help [servants]');
			config.cliParse();
			var help = collapseWhitespaceToOneSpace( config.cliHelpMessage() );
			assert.equal( help, "Flags: -h, --help [servants]" );
		})
	});

	describe('stdin', function(){

		it('ignores stdin if return null', function(){
			stdinReadSyncResponse = null;
			config.cliStdin( 'path', '-d, --data [text]', 'A text string to process' );
			config.cliParse();

			assert.equal( config.get('path'), undefined );
		});

		it('reads stdin to the path', function(){
			stdinReadSyncResponse = 'this is the data';
			config.cliStdin( 'path', '-d, --data [text]', 'A text string to process' );
			config.cliParse();

			assert.equal( config.get('path'), 'this is the data' );
		});

		it('stdin will override command line option if both provided', function(){
			stdinReadSyncResponse = 'this is the data';
			config.cliStdin( 'path', '-d, --data [text]', 'A text string to process' );
			config.cliParse( "-d the_command_line_data ");

			assert.equal( config.get('path'), 'this is the data' );
		});

		it('uses the parser if given', function(){
			stdinReadSyncResponse = 'this is the lowercase data';
			function parser(s){ return String(s).toUpperCase(); }
			config.cliStdin( 'path', '-d, --data [text]', 'A text string to process', parser );
			config.cliParse();

			assert.equal( config.get('path'), 'THIS IS THE LOWERCASE DATA' );
		});

		it('accepts null for flags on stdin declaration', function(){
			stdinReadSyncResponse = 'this is the data';
			config.cliStdin( 'path', null, 'A text string to process' );
			config.cliParse();

			assert.equal( config.get('path'), 'this is the data' );
		});

		it('displays help for stdin declaration', function(){
			stdinReadSyncResponse = 'this is the data';
			config.cliStdin( 'path', null, 'A text string to process' );
			config.cliParse();

			var help = config.cliHelpMessage();

			assert.ok( help.indexOf('<stdin>') !== -1 );
			assert.ok( help.indexOf('A text string to process') !== -1 );
		});

	});
});
