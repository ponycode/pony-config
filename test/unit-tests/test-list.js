var expect = require("expect");
var _ = require('lodash');

var config = require('../../index');

var log = [];
function outputStream(){
    log.push([].slice.call(arguments));
}

beforeEach( function(){
    config.reset();
    log = [];
});

// Instance of a composite config data
function getObject(){
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
        regx : /[regx]/,
        undefined : undefined,
        bool : true
    };
}

describe('List smoketest', function(){

    it('should return log data', function(){
        config.object( getObject() );
        config.list( { outputStream : outputStream, noColor : true });
        expect( log.length).toBeGreaterThan( 0 );
    });

});

describe('List header', function(){
    it('should return log header', function(){
        config.findRuntimeEnvironment( { default: 'TEST' } );
        config.lock();
        config.list( { outputStream : outputStream, noColor : true });
        var out = log.join('/');
        expect( out).toContain('CONFIG');
        expect( out).toContain('[TEST]');
        expect( out).toContain('[LOCKED]');
    });

});

describe('Case sensitive List header', function(){
    it('should return log header', function(){
        config.options({ caseSensitiveEnvironments: true });
        config.findRuntimeEnvironment( { default: 'test' } );
        config.lock();
        config.list( { outputStream : outputStream, noColor : true });
        var out = log.join('/');
        expect( out).toContain('CONFIG');
        expect( out).toContain('[test]');
        expect( out).toContain('[LOCKED]');
    });

});


describe('List Properties', function(){

    it('should log a string', function(){
        config.set('key', 'string' );
        config.list( { outputStream : outputStream, noColor : true });
        var out = log.join('/');
        expect( out ).toContain('key');
        expect( out ).toContain('string');
        expect( out ).toContain('[SET]');
    });

    it('should log a map', function(){
        config.set('key', {
            key_a : "value_a",
            key_b : "value_b"
        } );
        config.list( { outputStream : outputStream, noColor : true });
        var out = log.join('/');
        expect( out ).toContain('key');
        expect( out ).toContain('value_a');
        expect( out ).toContain('value_b');
        expect( out ).toContain('[SET]');
    });

    it('should log an array', function(){
        config.set('key', [
            "value_a",
            "value_b"
        ] );
        config.list( { outputStream : outputStream, noColor : true });
        var out = log.join('/');
        expect( out ).toContain('key');
        expect( out ).toContain('value_a');
        expect( out ).toContain('value_b');
        expect( out ).toContain('[SET]');
    });

    it('should log a buffer', function(){
        config.set('key', new Buffer("buffer") );
        config.list( { outputStream : outputStream, noColor : true });
        var out = log.join('/');
        expect( out ).toContain('key');
        expect( out ).toContain('buffer');
        expect( out ).toContain('[SET]');
    });

    it('should log a date', function(){
        config.set('key', new Date( 2014, 11, 25) );
        config.list( { outputStream : outputStream, noColor : true });
        var out = log.join('/');
        expect( out ).toContain('key');
        expect( out ).toContain('Dec 25 2014');
        expect( out ).toContain('[SET]');
    });

    it('should log a function', function(){
        config.set('key', function(x){ return "func"; } );
        config.list( { outputStream : outputStream, noColor : true });
        var out = log.join('/');
        expect( out ).toContain('key');
        expect( out ).toContain('function');
        expect( out ).toContain('(x)');
        expect( out ).toContain('return');
        expect( out ).toContain('[SET]');
    });

    it('should log a RegExp', function(){
        config.set('key', /[regx]/ );
        config.list( { outputStream : outputStream, noColor : true });
        var out = log.join('/');
        expect( out ).toContain('key');
        expect( out ).toContain('/[regx]/');
        expect( out ).toContain('[SET]');
    });

    it('should log an undefined value', function(){
        config.set('key', undefined );
        config.list( { outputStream : outputStream, noColor : true });
        var out = log.join('/');
        expect( out ).toContain('key');
        expect( out ).toContain('undefined');
        expect( out ).toContain('[SET]');
    });

    it('should log a bool - true', function(){
        config.set('key', true );
        config.list( { outputStream : outputStream, noColor : true });
        var out = log.join('/');
        expect( out ).toContain('key');
        expect( out ).toContain('true');
        expect( out ).toContain('[SET]');
    });

    it('should log an bool - false', function(){
        config.set('key', false );
        config.list( { outputStream : outputStream, noColor : true });
        var out = log.join('/');
        expect( out ).toContain('key');
        expect( out ).toContain('false');
        expect( out ).toContain('[SET]');
    });

    it('should log a number', function(){
        config.set('key', 5492 );
        config.list( { outputStream : outputStream, noColor : true });
        var out = log.join('/');
        expect( out ).toContain('key');
        expect( out ).toContain('5492');
        expect( out ).toContain('[SET]');
    });
});


describe('List Depth', function() {

    it('should log four levels', function(){
        config.set('oneLevel', {
            twoLevel : {
                threeLevel : {
                    four: 4
                }
            }
        });
        config.list( { outputStream : outputStream, noColor : true });
        var out = log.join('/');
        expect( out ).toContain('oneLevel');
        expect( out ).toContain('twoLevel');
        expect( out ).toContain('threeLevel');
        expect( out ).toContain('four');
        expect( out ).toContain( '4' );
        expect( out ).toContain('[SET]');
    })

    it('should log three levels', function(){
        config.set('oneLevel', {
            twoLevel : {
                threeLevel : {
                    four: 4
                }
            }
        });
        config.list( { outputStream : outputStream, noColor : true, maxListDepth : 3 });
        var out = log.join('/');
        expect( out ).toContain('oneLevel');
        expect( out ).toContain('twoLevel');
        expect( out ).toContain('threeLevel');
        expect( out ).toNotContain('four');
        expect( out ).toNotContain( '4' );
        expect( out ).toContain('[SET]');
    });

    it('should log one level', function(){
        config.set('oneLevel', {
            twoLevel : {
                threeLevel : {
                    four: 4
                }
            }
        });
        config.list( { outputStream : outputStream, noColor : true, maxListDepth : 1 });
        var out = log.join('/');
        expect( out ).toContain('oneLevel');
        expect( out ).toNotContain('twoLevel');
        expect( out ).toNotContain('threeLevel');
        expect( out ).toNotContain('four');
        expect( out ).toNotContain( '4' );
        expect( out ).toContain('[SET]');
    });

    it('should log 0 levels', function(){
        config.set('oneLevel', {
            twoLevel : {
                threeLevel : {
                    four: 4
                }
            }
        });
        config.list( { outputStream : outputStream, noColor : true, maxListDepth : 0 });
        var out = log.join('/');
        expect( out ).toNotContain('oneLevel');
        expect( out ).toNotContain('twoLevel');
        expect( out ).toNotContain('threeLevel');
        expect( out ).toNotContain('four');
        expect( out ).toNotContain( '4' );
        expect( out ).toNotContain('[SET]');
    });
});

describe('List Value Length', function() {

    it('should truncate values', function () {
        config.set('key', '123456789');
        config.list({outputStream: outputStream, noColor: true, maxListValueLength: 5});
        var out = log.join('/');
        expect( out ).toContain('key');
        expect( out ).toContain('12345');
        expect( out ).toContain('...');
        expect( out ).toNotContain('123456');
        expect( out ).toContain('[SET]');
    });
});

describe('List Secure Value', function() {

    it('should hide secure value and nested keyPaths', function () {
        config.object({
            string: "string",
            mapObject: {
                key_a: "value_a",
                key_b: "value_b"
            }
        });

        config.list( {outputStream: outputStream, noColor: true, secure: ['mapObject']});
        var out = log.join('/');
        expect( out ).toContain('string');
        expect( out ).toContain('mapObject');
        expect( out ).toContain('****');
        expect( out ).toNotContain('value_a');
        expect( out ).toNotContain('value_b');
    });

    it('should hide secure value inside map with keyPath', function(){
		config.object({
			string: "string",
			mapObject: {
				key_a: "value_a",
				key_b: "value_b"
			},
			arrayObject: [
				{ key_c: "value_c" },
				{ key_d: "value_d" }
			]
		});

		config.list( {outputStream: outputStream, noColor: true, secure: ['mapObject.key_a']});
		var out = log.join('/');
		expect( out ).toContain('string');
		expect( out ).toContain('mapObject');
		expect( out ).toContain('key_a');
		expect( out ).toContain('key_b');
		expect( out ).toContain('****');
		expect( out ).toNotContain('value_a');
		expect( out ).toContain('value_b');
		expect( out ).toContain('arrayObject');
		expect( out ).toContain('key_c');
		expect( out ).toContain('key_d');
		expect( out ).toContain('value_c');
		expect( out ).toContain('value_d');
	});

	it('should hide secure value inside array with keyPath', function(){
		config.object({
			string: "string",
			mapObject: {
				key_a: "value_a",
				key_b: "value_b"
			},
			arrayObject: [
				{ key_c: "value_c" },	// index 0
				{ key_d: "value_d" }	// index 1
			]
		});

		config.list( {outputStream: outputStream, noColor: true, secure: ['arrayObject.0']});
		var out = log.join('/');
		expect( out ).toContain('string');
		expect( out ).toContain('mapObject');
		expect( out ).toContain('key_a');
		expect( out ).toContain('key_b');
		expect( out ).toContain('value_a');
		expect( out ).toContain('value_b');
		expect( out ).toContain('arrayObject');
		expect( out ).toNotContain('key_c');
		expect( out ).toContain('key_d');
		expect( out ).toNotContain('value_c');
		expect( out ).toContain('value_d');
		expect( out ).toContain('****');
	});

});

describe('List formatter option', function() {

    it('should output integers as hex', function(){
        config.object({
            string: "string",
            mapObject: {
                key_a: 3.15,
                key_b: 17
            }
        });

		function numberToHexString(d, padding ){
			var unsignedInt = d >>> 0;
			var hex = Number(unsignedInt).toString(16).toUpperCase();
			padding = typeof (padding) === "undefined" || padding === null ? padding = 8 : padding;
			while (hex.length < padding) {
				hex = "0" + hex;
			}
			return hex;
		}

		function formatter( value, key ){
            if( _.isInteger( value )){
				return numberToHexString( value, 8 );
            }else{
            	return value;
			}
        }

        config.list( {outputStream: outputStream, noColor: true, formatter: formatter });
		var out = log.join('/');
		expect( out ).toContain('string');
		expect( out ).toContain('mapObject');
		expect( out ).toContain('3.15');
		expect( out ).toContain('00000011');
    })
});
