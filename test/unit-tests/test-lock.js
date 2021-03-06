var assert = require("assert");
var expect = require("expect");

var _ = require('lodash');

var config = require('../../index');

beforeEach( function(){
    config.reset();
});

// Instance of a composite config data
function getInitialObject(){
    return {
        string : "string",
        mapObject : {
            key_a : "value_a",
            key_b : "value_b"
        },
        array : ["value_a","value_b"],
        buffer : new Buffer("buffer"),
        date : new Date(2014, 11, 25),
        fn : function(x){ return "func"; },
        regx : /[regx]/
    };
}

describe('Lock makes data objects immutable', function(){

    it('should not change under set', function(){
        var instance = getInitialObject();

        config.object( instance );
        config.lock( false );

        instance.mapObject.key_a = "new value";
        assert.deepEqual( config.get('mapObject.key_a'), "value_a" );
        
        var subObject = config.get("mapObject");
        subObject.key_a = "new value";
        assert.deepEqual( config.get('mapObject.key_a'), "value_a" );

        var subObject = config.set("mapObject.key_a", "new value");
        assert.deepEqual( config.get('mapObject.key_a'), "value_a" );
    });
    
});

describe('Lock guards use methods', function(){

    it('should not change under calls to object', function(){
        var instance = getInitialObject();
        var goldStandard = _.cloneDeep( instance );

        config.object( instance );
        config.lock( false );

        var otherObject = { string : 'wrongstring' };
        config.object( otherObject );
        assert.deepEqual( config.get('.'), goldStandard );
    });

    it('should not change under calls to file', function(){
        var instance = getInitialObject();
        var goldStandard = _.cloneDeep( instance );

        config.object( instance );
        config.lock( false );

        config.file('test/data/config_1.json');
        assert.deepEqual( config.get('.'), goldStandard );
    });
});

describe('Lock guards set method', function(){

    it('should not change under set', function(){
        var instance = getInitialObject();
        var goldStandard = _.cloneDeep( instance );

        config.object( instance );
        config.lock( false );

        config.set( "string", "wrongStrong" );
        assert.deepEqual( config.get('.'), goldStandard );
    });
});

describe('Lock can throw exception', function(){
    it('should throw exception on set', function(){
        var instance = getInitialObject();

        config.object( instance );
        config.lock( true );
        expect( function(){
            config.set( "string", "change");
        }).toThrow(/lock/);
    });

    it('should throw exception on set using exceptionOnLocked config setting', function(){
        var instance = getInitialObject();
        config.options({ exceptionOnLocked : true });
        config.object( instance );
        config.lock();
        expect( function(){
            config.set( "string", "change");
        }).toThrow(/lock/);
    });

    it('should throw exception on use... using exceptionOnLocked config setting', function(){
        var instance = getInitialObject();
        config.options({ exceptionOnLocked : true });
        config.object( instance );
        config.lock();

        expect( function(){
            config.object( instance );
        }).toThrow(/lock/);
    });

    it('should NOT throw exception on use... overriding exceptionOnLocked config setting', function(){
        var instance = getInitialObject();
        config.options({ exceptionOnLocked : true });
        config.object( instance );
        config.lock(false);

        expect( function(){
            config.object( instance );
        }).toNotThrow(/lock/);
    });

});

describe('Lock returns deep clone', function(){

    it('should not change under string modification', function() {
        var instance = getInitialObject();
        var goldStandard = _.cloneDeep( instance );

        config.object( instance );
        config.options( {cloneWhenLocked: true} );
        config.lock( false );

        var allConfig = config.get('.');

        allConfig.string = "wrongStrong";
        assert.deepEqual( config.get('.'), goldStandard );
    });


    it('should not change under map modification', function() {
        var instance = getInitialObject();
        var goldStandard = _.cloneDeep( instance );

        config.object( instance );
        config.options( {cloneWhenLocked: true} );
        config.lock( false );

        var mapObject = config.get('mapObject');

        mapObject.added = true;
        assert.deepEqual( config.get('.'), goldStandard );
    });


    it('should not change under array modification', function() {
        var instance = getInitialObject();
        var goldStandard = _.cloneDeep( instance );

        config.object( instance );
        config.options( {cloneWhenLocked: true} );
        config.lock( false );

        var allConfig = config.get('.');

        allConfig.array.push("wrongItem");
        assert.deepEqual( config.get('.'), goldStandard );
    });

    it('should not change under Buffer modification', function() {
        var instance = getInitialObject();
        var goldStandard = _.cloneDeep( instance );

        config.object( instance );
        config.options( {cloneWhenLocked: true} );
        config.lock( false );

        var allConfig = config.get('.');

        allConfig.buffer[0] = "X";
        assert.deepEqual( config.get('.'), goldStandard );
    });


    it('should not change under date modification', function() {
        var instance = getInitialObject();
        var goldStandard = _.cloneDeep( instance );

        config.object( instance );
        config.options( {cloneWhenLocked: true} );
        config.lock( false );

        var allConfig = config.get('.');

        allConfig.date = new Date(1998, 2, 1);
        assert.deepEqual( config.get('.'), goldStandard );
    });

    it('should not change under function modification', function() {
        var instance = getInitialObject();
        var goldStandard = _.cloneDeep( instance );

        config.object( instance );
        config.options( {cloneWhenLocked: true} );
        config.lock( false );

        var allConfig = config.get('.');

        allConfig.fn = function () {
            return "wrongFunc";
        };

        assert.equal( String(config.get('fn')), String(goldStandard.fn));
    });

    it('should not change under regex modification', function() {
        var instance = getInitialObject();
        var goldStandard = _.cloneDeep( instance );

        config.object( instance );
        config.options( {cloneWhenLocked: true} );
        config.lock( false );

        var allConfig = config.get('.');

        allConfig.regx = /wrongregx/;
        assert.deepEqual( config.get('.'), goldStandard );
    });

});
