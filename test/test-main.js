var assert = require("assert");
var expect = require('expect');

var config = require('../index');

beforeEach( function(){
    config.reset();
});

describe('Intantiate', function(){
    it('should return an object', function(){
        assert.equal( typeof config, 'object');
    });
});

describe('Get and Set Paths', function(){
    it('set simple path', function(){
        config.set( 'root', 'value' );
        assert.equal( 'value', config.get('root') );
    });

    it('set path of new object', function(){
        config.set('root.sub1', 'value' );
        assert.equal( 'value', config.get('root.sub1') );
    });

    it('set deep path of new object', function(){
        config.set('root.sub1.sub2.sub3', 'value' );
        assert.equal( 'value', config.get('root.sub1.sub2.sub3') );
    });

    it('set extends', function(){
        config.set('root.sub1', 'value_1' );
        config.set('root.sub2', 'value_2' );
        assert.equal( 'value_1', config.get('root.sub1') );
        assert.equal( 'value_2', config.get('root.sub2') );
    });

    it('set overwrites', function(){
        config.set('root', 'value_1' );
        config.set('root', 'value_2' );
        assert.equal( 'value_2', config.get('root') );
    });

});

describe('Get defaults', function(){
    it('missing key no default', function(){
        assert.equal( undefined, config.get('root') );
    });

    it('missing key with default false', function(){
        assert.equal( false, config.get('root', false) );
    });

    it('missing key with default true', function(){
        assert.equal( true, config.get('root', true) );
    });

    it('missing key with default object', function(){
        assert.deepEqual( {"key" : "value"}, config.get('root', {"key" : "value"} ));
    });

    it('present key returns own value', function(){
        config.set( "key", "value" );
        assert.equal( "value", config.get('key', "default" ));
    });
});

describe('object', function(){
    it('empty object should get undefined', function(){
        assert.equal( undefined, config.get('missing') );
        assert.equal( undefined, config.get('missing.path') );
    });

    it('simple object should be set', function(){
        config.object({ root_1  : true });
        config.object({ root_2  : false });

        assert.equal( true, config.get('root_1') );
        assert.equal( false, config.get('root_2') );
    });

    it('missing objects should be undefined', function(){
        config.object({ root_1  : true });

        assert.equal( undefined, config.get('root_2') );
    });

    it('complex object should be set', function(){
        config.object({ root_1 : { "sub_1" : { sub_2 : true }} });

        assert.equal( true, config.get('root_1.sub_1.sub_2') );
    });
});

describe('use file', function(){
    it('use a file containing an object', function(){
        config.file('test/data/config_1.json');
        assert.equal( 'r1_value_1', config.get('root_node_1') );
        assert.equal( 'r2_s2_value_1', config.get('root_node_2.sub_node_2') );
    });

    it('use file, two files containing an object, replaced or merged', function(){
        config.file('test/data/config_1.json');
        config.file('test/data/config_2.json');
        assert.equal( 'r1_value_2', config.get('root_node_1'), 'root node should be replaced' );
        assert.equal( 'r2_s2_value_2', config.get('root_node_2.sub_node_2'), 'root node 2 sub_value2 should be replaced' );
        assert.equal( 'r3_value_1', config.get('root_node_3'), 'root node 3 should be original' );
        assert.equal( 'r4_value_2', config.get('root_node_4'), 'root node 4 should be new' );

        assert.equal('r2_s1_value_1', config.get('root_node_2.sub_node_1'), 'root node 2 sub_node1 should be original');
    });

    it('should not throw exception for bad json in file', function(){
        expect( function(){
            config.file('test/data/config_3.json');
        }).toNotThrow();
    });
});

describe('env', function(){

    beforeEach( function(){
        process.env['PONYCONFIG_TRUE'] = 1;
        process.env['PONYCONFIG_FALSE'] = 0;
        delete process.env['PONYCONFIG_MISSING'];
        process.env['ENVVAR_ENVIRONMENT'] = 'Test File Environment';
    });

    it('use environment variables', function(){
        config.env( 'test.trueValue', 'PONYCONFIG_TRUE');
        config.env( 'test.falseValue', 'PONYCONFIG_FALSE');
        config.env( 'test.missingValue', 'PONYCONFIG_MISSING');
        assert.equal( true, config.get( 'test.trueValue' ));
        assert.equal( false, config.get( 'test.falseValue'));
        assert.equal( undefined, config.get( 'test.missingValue'));
    });

    it('use environment variables in when clause', function(){
        config.useRuntimeEnvironment('Test Environment');
        config.when( 'Wrong Environment').env( 'key_unset', 'PONYCONFIG_TRUE' );
        config.when( 'Test Environment').env( 'key_set', 'PONYCONFIG_TRUE' );

        assert.equal( undefined, config.get( 'key_unset' ));
        assert.equal( true, config.get( 'key_set'));
    });

});

describe('findRuntimeEnvironment', function(){

    beforeEach( function(){
        process.env['PONYCONFIG_ENV'] = 'ENVVAR_ENVIRONMENT';
        delete process.env['PONYCONFIG_ENV_MISSING'];
    });

    it('search environment, default', function(){
        config.options( { caseSensitiveEnvironments: true} );
        config.findRuntimeEnvironment( { default: 'Default Environment' } );
        assert.equal( 'Default Environment', config.getRuntimeEnvironment());
    });

    it('search environment, missing file', function(){
        config.options( { caseSensitiveEnvironments: true} );
        config.findRuntimeEnvironment( { paths: "test/data/missing-file", default: 'Default Environment' } );
        assert.equal( 'Default Environment', config.getRuntimeEnvironment());
    });

    it('search environment, single file', function(){
        config.options( { caseSensitiveEnvironments: true} );
        config.findRuntimeEnvironment( { paths: "./test/data/env-file", default: 'Default Environment' } );
        assert.equal( 'Test File Environment', config.getRuntimeEnvironment());
    });

    it('search environment, search file paths, one path', function(){
        config.options( { caseSensitiveEnvironments: true} );
        config.findRuntimeEnvironment( { paths: ["test/data/env-file"], default: 'Default Environment' } );
        assert.equal( 'Test File Environment', config.getRuntimeEnvironment());
    });

    it('search environment, search file paths, multiple paths', function(){
        config.options( { caseSensitiveEnvironments: true} );
        config.findRuntimeEnvironment( { paths: [".", "test/data/missing-file", "test/data/env-file"], default: 'Default Environment' } );
        assert.equal( 'Test File Environment', config.getRuntimeEnvironment());
    });

    it('search environment, env var not found', function(){
        config.options( { caseSensitiveEnvironments: true} );
        config.findRuntimeEnvironment( { env: "PONYCONFIG_ENV_MISSING", paths: [".", "test/data/missing-file", "test/data/env-file"], default: 'Default Environment' } );
        assert.equal( 'Test File Environment', config.getRuntimeEnvironment());
    });

    it('search environment, env var used', function(){
        config.options( { caseSensitiveEnvironments: true} );
        config.findRuntimeEnvironment( { env: "PONYCONFIG_ENV", paths: [".", "test/data/missing-file", "test/data/env-file"], default: 'Default Environment' } );
        assert.equal( 'ENVVAR_ENVIRONMENT', config.getRuntimeEnvironment());
    });

    it('search environment, env var used, debug true', function(){
        config.options( { caseSensitiveEnvironments: true} );
        config.findRuntimeEnvironment( { debug: true, env: "PONYCONFIG_ENV", paths: [".", "test/data/missing-file", "test/data/env-file"], default: 'Default Environment' } );
        assert.equal( 'ENVVAR_ENVIRONMENT', config.getRuntimeEnvironment());
    });

    it('search environment, single file, debug true', function(){
        config.options( { caseSensitiveEnvironments: true} );
        config.findRuntimeEnvironment( { debug: true, paths: "./test/data/env-file", default: 'Default Environment' } );
        assert.equal( 'Test File Environment', config.getRuntimeEnvironment());
    });

    it('search environment, empty options', function(){
        config.options( { caseSensitiveEnvironments: true} );
        config.findRuntimeEnvironment( {} );
        assert.equal( false, config.getRuntimeEnvironment());
    });

    it('search environment, empty options, debug true', function(){
        config.options( { caseSensitiveEnvironments: true} );
        config.findRuntimeEnvironment( { debug: true } );
        assert.equal( false, config.getRuntimeEnvironment());
    });

    it('search environment, env var not found, debug true', function(){
        config.options( { caseSensitiveEnvironments: true} );
        config.findRuntimeEnvironment( { debug: true, env: "PONYCONFIG_ENV_MISSING", paths: [".", "test/data/missing-file", "test/data/env-file"], default: 'Default Environment' } );
        assert.equal( 'Test File Environment', config.getRuntimeEnvironment());
    });

});

describe('useRuntimeEnvironment', function(){
    it('initially should be false', function(){
        assert.equal( false, config.getRuntimeEnvironment());
    });

    it('falsey stays false', function(){
		config.useRuntimeEnvironment( false );
		assert.equal( false, config.getRuntimeEnvironment());
		config.useRuntimeEnvironment( undefined );
		assert.equal( false, config.getRuntimeEnvironment());
		config.useRuntimeEnvironment( null );
		assert.equal( false, config.getRuntimeEnvironment());
	});

    it('set environment with a string', function(){
        config.options( { caseSensitiveEnvironments: true} );
        config.useRuntimeEnvironment('Test Environment');
        assert.equal( 'Test Environment', config.getRuntimeEnvironment());
    });

    it('set environment with a string, when switches configuration', function(){
        config.options( { caseSensitiveEnvironments: true} );
        config.useRuntimeEnvironment('Test Environment');
        config.when('Wrong Environment').object( { wrong : true } );
        config.when('Test Environment').object( { test : true } );
        assert.equal( undefined, config.get('wrong'), 'should not set "wrong"');
        assert.equal( true, config.get('test'), 'should set "test"');
    });

    it('set environment with a string, not clause -> is used', function(){
        config.options( { caseSensitiveEnvironments: true} );
        config.useRuntimeEnvironment('Test Environment');
        config.object( { always : true } );
        assert.equal( true, config.get('always'), 'should set "always"');
    });

    it('set environment with a string, always is used', function(){
        config.options( { caseSensitiveEnvironments: true} );
        config.useRuntimeEnvironment('Test Environment');
        config.always().object( { always : true } );
        assert.equal( true, config.get('always'), 'should set "always"');
    });

});


describe('isRuntimeEnvironment', function(){

	it('should match', function(){
		config.useRuntimeEnvironment('test');
		var isEnv = config.isRuntimeEnvironment('test');
		assert.equal( isEnv, true );
	});

	it('should not match', function(){
		config.useRuntimeEnvironment('not_test');
		var isEnv = config.isRuntimeEnvironment('test');
		assert.equal( isEnv, false );
	});

	it('should be case insensitive', function(){
		config.useRuntimeEnvironment('testCaseSensiTivE');
		var isEnv = config.isRuntimeEnvironment('TESTCASEsensitive');
		assert.equal( isEnv, true );
	});

	it('should not be case insensitive', function(){
		config.options( { caseSensitiveEnvironments: true });
		config.useRuntimeEnvironment('testCaseInSensiTivE');
		var isntEvn = config.isRuntimeEnvironment('TESTCASEINsensitive');
		var isEnv = config.isRuntimeEnvironment('testCaseInSensiTivE');
		assert.equal( isntEvn, false );
		assert.equal( isEnv, true );
	});
});

describe('function', function(){
	it( 'selected function should get executed', function(){
		var functionOneWasEvaluated = 0;
		var functionTwoWasEvaluated = 0;

		config.set('functionOneConfigResult', "not called" );
		config.set('functionTwoConfigResult', "not called" );
		function functionOne(){
			functionOneWasEvaluated++;
		    return {
				functionOneConfigResult: true
            };
		}

		function functionTwo(){
			functionTwoWasEvaluated++;
			return {
				functionTwoConfigResult: true
			};
		}

		config.useRuntimeEnvironment('Test Environment');
		config.when( 'Wrong Environment' ).function( functionOne );
		config.when( 'Test Environment' ).function( functionTwo );

		assert.equal( functionOneWasEvaluated, 0 );
		assert.equal( functionTwoWasEvaluated, 1 );

		assert.equal( "not called", config.get( 'functionOneConfigResult' ) );
		assert.equal( true, config.get( 'functionTwoConfigResult' ) );
	} );

});


describe('set', function(){
    it( 'set controlled by when', function(){
		config.useRuntimeEnvironment('Test Environment');
		config.when( 'Wrong Environment' ).set('wrong', true );
        config.when( 'Test Environment' ).set('right', true );

        assert.equal( config.get('wrong'), undefined );
        assert.equal( config.get('right'), true );
    });
});
