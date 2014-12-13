var assert = require("assert");

var Config = require('../lib/Config');
var config;

beforeEach( function(){
    config = new Config();
});

describe('obj', function(){
    it('should return an object', function(){
        assert.equal( typeof config, 'object');
    });
});

describe('Merge Primitives', function(){

    it('should return a number', function(){
        assert.equal( config.mergeObjects( 2, undefined ), 2);
    });

    it('should return a number', function(){
        assert.equal( config.mergeObjects( 2, undefined ), 2);
    });

    it('should return a number', function(){
        assert.equal( config.mergeObjects( undefined, 2 ), 2);
    });

    it('should return a number', function(){
        assert.equal( config.mergeObjects( 4, 2 ), 2);
    });

    it('should return a string', function(){
        assert.equal( config.mergeObjects( 4, "house" ), "house");
    });

    it('should return a string', function(){
        assert.equal( config.mergeObjects( "pickle", "house" ), "house");
    });

    it('should return a boolean', function(){
        assert.equal( config.mergeObjects( false, true ), true);
    });

    it('should return a boolean', function(){
        assert.equal( config.mergeObjects( true, false ), false);
    });
});

describe('Merge Primitive and Empty Object', function() {
    it('should return a boolean', function(){
        assert.equal( config.mergeObjects( {}, true ), true);
    });

    it('should return an object', function(){
        assert.deepEqual( config.mergeObjects( true, {} ), {});
    });
});

describe('Merge Primitive and Object', function() {
    it('should return a boolean', function(){
        assert.equal( config.mergeObjects( { key : "value" }, true ), true);
    });

    it('should return an object', function(){
        assert.deepEqual( config.mergeObjects( true, { key : "value" } ), { key : "value" });
    });
});

describe('Merge Objects 1 level deep', function() {
    it('should merge keys into new object', function(){
        assert.deepEqual( config.mergeObjects( { key1 : "value1" }, { key2 : "value2" } ), { key1 : "value1", key2 : "value2" });
    });

    it('should merge object over another', function(){
        assert.deepEqual( config.mergeObjects( { key1 : "value1" }, { key1 : "value2" } ), { key1 : "value2" });
    });
});

describe('Merge Objects 2 levels deep', function() {

    it('should merge object over primitive property', function(){
        assert.deepEqual( config.mergeObjects( { key1 : "value1" }, { key1 : { key2 : "value2" }} ), { key1 : { key2 : "value2" }});
    });

    it('should merge primitive property over object', function(){
        assert.deepEqual( config.mergeObjects( { key1 : { key2 : "value2" }},  { key1 : "value1" } ), { key1 : "value1" });
    });

    it('should replace primitive with deep object', function(){
        assert.deepEqual( config.mergeObjects( 4, { key1 : { key2 : "value2" }} ), { key1 : { key2 : "value2" }});
    });

    it('should replace deep object with primitive', function(){
        assert.deepEqual( config.mergeObjects( { key1 : { key2 : "value2" }}, 4 ), 4);
    });

    it('should merge properties in object 2 levels deep', function(){
        assert.deepEqual( config.mergeObjects( { key1 : { key2 : "value2" }}, { key1 : { key3 : "value3" }} ), { key1 : { key2 : "value2", key3 : "value3" }});
    });
});

describe('Original objects remain unchanged', function() {

    it('should merge object over primitive property', function(){

        var inputObject1 = {
            key1 : "value1",
            key2 : {
                key2a : "value2a",
                key2b : "value2b"
            },
            key3 : {
                key3a : {
                    key3a1: "value3a1"
                }
            }
        };

        var inputObject2 = {
            key1 : "value1`",               // key1 gets new value
            key2 : {
                key2c : "value2c`"          // key 2 news property
            },
            key3 : "value3`"                // key3 gets replaced with a primitive
        };

        var outputObject = config.mergeObjects( inputObject1, inputObject2 );

        assert.deepEqual( outputObject,
            {
                key1 : "value1`",
                key2 : {
                    key2a : "value2a",
                    key2b : "value2b",
                    key2c : "value2c`"
                },
                key3 : "value3`"                // key3 gets replaced with a primitive
            });

        assert.deepEqual( inputObject1,
            {
                key1 : "value1",
                key2 : {
                    key2a : "value2a",
                    key2b : "value2b"
                },
                key3 : {
                    key3a : {
                        key3a1: "value3a1"
                    }
                }
            });

        assert.deepEqual( inputObject2,
            {
                key1 : "value1`",               // key1 gets new value
                key2 : {
                    key2c : "value2c`"          // key 2 news property
                },
                key3 : "value3`"                // key3 gets replaced with a primitive
            });
    });

});

