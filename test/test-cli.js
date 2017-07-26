var assert = require("assert");
var expect = require('expect');

var config = require('../index');

beforeEach( function(){
	config.reset();
});

describe('cliConfig', function(){

	describe('option formats', function(){
		it('option with no dash works', function(){
			config.options( { customCommandlineArguments : '-v version' });
			config.cliOption( 'version', 'v' ).cliParse();
			assert.equal( 'version', config.get('version'), 'should be set');
		});

		it('option with dash works', function(){
			config.options( { customCommandlineArguments : '-v version' });
			config.cliOption( 'version', '-v' ).cliParse();
			assert.equal( 'version', config.get('version'), 'should be set');
		});

		it('option with short and long works using short', function(){
			config.options( { customCommandlineArguments : '-v version' });
			config.cliOption( 'version', '-v, --version' ).cliParse();
			assert.equal( 'version', config.get('version'), 'should be set');
		});

		it('option with short and long works using long', function(){
			config.options( { customCommandlineArguments : '--version version' });
			config.cliOption( 'version', '-v, --version' ).cliParse();
			assert.equal( 'version', config.get('version'), 'should be set');
		});

		it('option with array for backwards compatibility', function(){
			config.options( { customCommandlineArguments : '--version version' });
			config.cliOption( 'version', ['-v', '--version'] ).cliParse();
			assert.equal( 'version', config.get('version'), 'should be set');
		});

		it('option with extra whitespace works', function(){
			config.options( { customCommandlineArguments : '--version version' });
			config.cliOption( 'version', '   -v, 	--version\n\r' ).cliParse();
			assert.equal( 'version', config.get('version'), 'should be set');
		});

		it('accepts a parameter in option', function(){
			config.options( { customCommandlineArguments : '--version version' });
			config.cliOption( 'version', '-v, --version [a-version]' ).cliParse();
			assert.equal( 'version', config.get('version'), 'should be set');
		});
	});

	describe("Optional parameters", function(){

		function listParser( string ){
			return string.split(",");
		}

		it('option works all parameters', function(){
			config.options( { customCommandlineArguments : '--names joe,bob,tony' });
			config.cliOption( 'names', '-n, --names [name,...]', 'list of names', false, listParser ).cliParse();
			var list = config.get('names');
			assert.deepEqual( list, ['joe','bob','tony'] );
		});

		it('option works without optional default', function(){
			config.options( { customCommandlineArguments : '--names joe,bob,tony' });
			config.cliOption( 'names', '-n, --names [name,...]', 'list of names', listParser ).cliParse();
			var list = config.get('names');
			assert.deepEqual( list, ['joe','bob','tony'] );
		});
	});

	describe("Gathers arguments", function(){
		it('works without any options', function(){
			config.options( { customCommandlineArguments : 'joe bob tony' });
			config.cliArguments( 'names' ).cliParse();
			var list = config.get('names');
			assert.deepEqual( list, ['joe','bob','tony'] );
		});

		it('works with options when none included', function(){
			config.options( { customCommandlineArguments : 'joe bob tony' });
			config.cliOption( 'size', '-s, --size [meters]', 'size of it' );
			config.cliArguments( 'names' ).cliParse();
			var list = config.get('names');
			assert.deepEqual( list, ['joe','bob','tony'] );
		});

		it('works with options when used', function(){
			config.options( { customCommandlineArguments : '--size 11 joe bob tony' });
			config.cliOption( 'size', '-s, --size [meters]', 'size of it' );
			config.cliArguments( 'names' ).cliParse();
			var list = config.get('names');
			assert.deepEqual( list, ['joe','bob','tony'] );
			assert.equal( 11, config.get('size'));
		});

		it('empty -- after all options marks beginning of arguments', function(){
			config.options( { customCommandlineArguments : '-r -- joe bob tony' });
			config.cliOption( 'recurse', '-r', 'recurse if included' );
			config.cliArguments( 'names' ).cliParse();
			var list = config.get('names');
			assert.deepEqual( list, ['joe','bob','tony'] );
			assert.equal( true, config.get('recurse'));
		});
	});

});