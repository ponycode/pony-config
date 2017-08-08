var assert = require("assert");

var config = require('../index');
var path = require('path');

beforeEach( function(){
	config.reset();
});

describe('require', function(){
	it('should return the object', function(){
		config.require( path.resolve('test/data/require-me.js'));
		assert.equal( config.get('test'), 'value' );
	});
});
