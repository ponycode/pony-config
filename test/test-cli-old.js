var assert = require("assert");
var expect = require('expect');

var config = require('../index');

beforeEach( function(){
	config.reset();
});


describe('useCommandLine', function(){

	it('one command line argument with value', function(){
		config.setOptions( { customCommandlineArguments : '-f filename -v version -ab' });
		config.useCommandLineArguments( { path: 'version', options : 'v' } );
		assert.equal( 'version', config.get('version'), 'should be set');
	});

	it('command line arguments with values', function(){
		config.setOptions( { customCommandlineArguments : '-f filename -v version -ab' });
		config.useCommandLineArguments(
			[
				{ path: 'version', options : 'v' },
				{ path: 'filename', options : ['-f', '--file'] },
				{ path: 'boolean.a', options : 'a' },
				{ path: 'boolean.b', options : 'b' },
				{ path: 'boolean.c', options : 'c' }
			]);
		assert.equal( 'version', config.get('version'), 'should set version');
		assert.equal( 'filename', config.get('filename'), 'should set file');
		assert.equal( true, config.get('boolean.a'), 'should be set');
		assert.equal( true, config.get('boolean.b'), 'should be set');
		assert.equal( undefined, config.get('boolean.c'), 'should be unset');
	});

});

describe('useCommandLine empty arguments', function() {

	it('one command line argument with value', function(){
		config.setOptions( { customCommandlineArguments : '' });
		config.useCommandLineArguments( { path: 'version', options : 'v' } );
		var version = config.get('version');
		assert.equal( undefined, version, 'should be unset');
	});
});

describe('parseCommandlineArguments empty arguments', function() {

	it('parseCommandlineArguments', function(){
		config.setOptions( { customCommandlineArguments : '' });
		config.parseCommandlineArguments( { path: 'version', options : 'v' } );
		var version = config.getCommandlineValue('version');
		assert.equal( undefined, version, 'should be unset');
	});
});

describe('parseCommandlineArguments with value', function() {

	it('getCommandlineValue', function(){
		config.setOptions( { customCommandlineArguments : '-f filename -v version -ab' });
		config.parseCommandlineArguments( { path: 'version', options : 'v' } );
		var version = config.getCommandlineValue('version');
		assert.equal( "version", version, 'should set');
	});
});