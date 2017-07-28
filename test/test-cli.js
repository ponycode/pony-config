var assert = require("assert");
var expect = require('expect');

var config = require('../index');

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

});