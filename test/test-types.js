var expect = require("expect");
var _ = require('lodash');

var config = require('../index');

function getObject(){
    return {
        string : "string",
        mapObject : {
            key_a : "value_a",
            key_b : "value_b"
        },
        array : ["value_a","value_b"],
        buffer : new Buffer("buffer"),
        date : new Date(2014, 12, 25),
        fn : function(x){ return "func"; },
        regx : /[regx]/,
        undefined : undefined,
        bool : true
    };
}

beforeEach( function(){
    config.reset();
});

describe('Types should store and retrieve correctly', function(){

    it('should return a string', function(){
        config.set('object', getObject() );
        var value = config.get('object.string');
        expect( value ).toBeA( 'string' );
    });

    it('should return an object', function(){
        config.set('object', getObject() );
        var value = config.get('object.mapObject');
        expect( value ).toBeA( Object );
    });

    it('should return an array', function(){
        config.set('object', getObject() );
        var value = config.get('object.array');
        expect( value ).toBeA( Array );
    });

    it('should return a Buffer', function(){
        config.set('object', getObject() );
        var value = config.get('object.buffer');
        expect( value ).toBeA( Buffer );
    });

    it('should return a Function', function(){
        config.set('object', getObject() );
        var value = config.get('object.fn');
        expect( value ).toBeA( Function );
    });

    it('should return a RegExp', function(){
        config.set('object', getObject() );
        var value = config.get('object.regx');
        expect( value ).toBeA( RegExp );
    });

    it('should return undefined', function(){
        config.set('object', getObject() );
        var value = config.get('object.undefined');
        expect( value ).toBeA( 'undefined' );
    });

    it('should return a Boolean', function(){
        config.set('object', getObject() );
        var value = config.get('object.bool');
        expect( value ).toBeA( 'boolean' );
    });

});

describe('Types should store and retrieve correctly when locked', function(){

    it('should return a string', function(){
        config.set('object', getObject() );
        config.lock();
        var value = config.get('object.string');
        expect( value ).toBeA( 'string' );
    });

    it('should return an object', function(){
        config.set('object', getObject() );
        config.lock();
        var value = config.get('object.mapObject');
        expect( value ).toBeA( Object );
    });

    it('should return an array', function(){
        config.set('object', getObject() );
        config.lock();
        var value = config.get('object.array');
        expect( value ).toBeA( Array );
    });

    it('should return a Buffer', function(){
        config.set('object', getObject() );
        config.lock();
        var value = config.get('object.buffer');
        expect( value ).toBeA( Buffer );
    });

    it('should return a Function', function(){
        config.set('object', getObject() );
        config.lock();
        var value = config.get('object.fn');
        expect( value ).toBeA( Function );
    });

    it('should return a RegExp', function(){
        config.set('object', getObject() );
        config.lock();
        var value = config.get('object.regx');
        expect( value ).toBeA( RegExp );
    });

    it('should return undefined', function(){
        config.set('object', getObject() );
        config.lock();
        var value = config.get('object.undefined');
        expect( value ).toBeA( 'undefined' );
    });

    it('should return a Boolean', function(){
        config.set('object', getObject() );
        config.lock();
        var value = config.get('object.bool');
        expect( value ).toBeA( 'boolean' );
    });

});