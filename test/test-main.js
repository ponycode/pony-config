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

describe('useObject', function(){
    it('empty object should get undefined', function(){
        assert.equal( undefined, config.get('missing') );
        assert.equal( undefined, config.get('missing.path') );
    });

    it('simple object should be set', function(){
        config.useObject({ root_1  : true });
        config.useObject({ root_2  : false });

        assert.equal( true, config.get('root_1') );
        assert.equal( false, config.get('root_2') );
    });

    it('missing objects should be undefined', function(){
        config.useObject({ root_1  : true });

        assert.equal( undefined, config.get('root_2') );
    });

    it('complex object should be set', function(){
        config.useObject({ root_1 : { "sub_1" : { sub_2 : true }} });

        assert.equal( true, config.get('root_1.sub_1.sub_2') );
    });
});

describe('use file', function(){
    it('use a file containing an object', function(){
        config.useFile('test/data/config_1.json');
        assert.equal( 'r1_value_1', config.get('root_node_1') );
        assert.equal( 'r2_s2_value_1', config.get('root_node_2.sub_node_2') );
    });

    it('use file, two files containing an object, replaced or merged', function(){
        config.useFile('test/data/config_1.json');
        config.useFile('test/data/config_2.json');
        assert.equal( 'r1_value_2', config.get('root_node_1'), 'root node should be replaced' );
        assert.equal( 'r2_s2_value_2', config.get('root_node_2.sub_node_2'), 'root node 2 sub_value2 should be replaced' );
        assert.equal( 'r3_value_1', config.get('root_node_3'), 'root node 3 should be original' );
        assert.equal( 'r4_value_2', config.get('root_node_4'), 'root node 4 should be new' );

        assert.equal('r2_s1_value_1', config.get('root_node_2.sub_node_1'), 'root node 2 sub_node1 should be original');
    });

    it('should not throw exception for bad json in file', function(){
        expect( function(){
            config.useFile('test/data/config_3.json');
        }).toNotThrow();
    });
});


//-----------
// Expects in the environment variables:
// "PONYCONFIG_TRUE=1" and
// "PONYCONFIG_FALSE=0",
// and no definition for PONYCONFIG_MISSING
//-----------

describe('useEnvironmentVar', function(){
    it('use environment variables', function(){
        config.useEnvironmentVar( 'test.trueValue', 'PONYCONFIG_TRUE');
        config.useEnvironmentVar( 'test.falseValue', 'PONYCONFIG_FALSE');
        config.useEnvironmentVar( 'test.missingValue', 'PONYCONFIG_MISSING');
        assert.equal( true, config.get( 'test.trueValue' ));
        assert.equal( false, config.get( 'test.falseValue'));
        assert.equal( undefined, config.get( 'test.missingValue'));
    });

    it('use environment variables in when clause', function(){
        config.useEnvironment('Test Environment');
        config.when( 'Wrong Environment').useEnvironmentVar( 'key_unset', 'PONYCONFIG_TRUE' );
        config.when( 'Test Environment').useEnvironmentVar( 'key_set', 'PONYCONFIG_TRUE' );

        assert.equal( undefined, config.get( 'key_unset' ));
        assert.equal( true, config.get( 'key_set'));
    });

});

//-----------
// Expects in the environment variables:
// "PONYCONFIG_ENV=ENVVAR_ENVIRONMENT" and
// and no definition for PONYCONFIG_ENV_MISSING
//-----------

describe('findEnvironment', function(){
    it('search environment, default', function(){
        config.setOptions( { caseSensitiveEnvironments: true} );
        config.findEnvironment( { default: 'Default Environment' } );
        assert.equal( 'Default Environment', config.getEnvironment());
    });

    it('search environment, missing file', function(){
        config.setOptions( { caseSensitiveEnvironments: true} );
        config.findEnvironment( { paths: "test/data/missing-file", default: 'Default Environment' } );
        assert.equal( 'Default Environment', config.getEnvironment());
    });

    it('search environment, single file', function(){
        config.setOptions( { caseSensitiveEnvironments: true} );
        config.findEnvironment( { paths: "./test/data/env-file", default: 'Default Environment' } );
        assert.equal( 'Test File Environment', config.getEnvironment());
    });

    it('search environment, search file paths, one path', function(){
        config.setOptions( { caseSensitiveEnvironments: true} );
        config.findEnvironment( { paths: ["test/data/env-file"], default: 'Default Environment' } );
        assert.equal( 'Test File Environment', config.getEnvironment());
    });

    it('search environment, search file paths, multiple paths', function(){
        config.setOptions( { caseSensitiveEnvironments: true} );
        config.findEnvironment( { paths: [".", "test/data/missing-file", "test/data/env-file"], default: 'Default Environment' } );
        assert.equal( 'Test File Environment', config.getEnvironment());
    });

    it('search environment, env var not found', function(){
        config.setOptions( { caseSensitiveEnvironments: true} );
        config.findEnvironment( { env: "PONYCONFIG_ENV_MISSING", paths: [".", "test/data/missing-file", "test/data/env-file"], default: 'Default Environment' } );
        assert.equal( 'Test File Environment', config.getEnvironment());
    });

    it('search environment, env var used', function(){
        config.setOptions( { caseSensitiveEnvironments: true} );
        config.findEnvironment( { env: "PONYCONFIG_ENV", paths: [".", "test/data/missing-file", "test/data/env-file"], default: 'Default Environment' } );
        assert.equal( 'ENVVAR_ENVIRONMENT', config.getEnvironment());
    });

    it('search environment, env var used, debug true', function(){
        config.setOptions( { caseSensitiveEnvironments: true} );
        config.findEnvironment( { debug: true, env: "PONYCONFIG_ENV", paths: [".", "test/data/missing-file", "test/data/env-file"], default: 'Default Environment' } );
        assert.equal( 'ENVVAR_ENVIRONMENT', config.getEnvironment());
    });

    it('search environment, single file, debug true', function(){
        config.setOptions( { caseSensitiveEnvironments: true} );
        config.findEnvironment( { debug: true, paths: "./test/data/env-file", default: 'Default Environment' } );
        assert.equal( 'Test File Environment', config.getEnvironment());
    });

    it('search environment, empty options', function(){
        config.setOptions( { caseSensitiveEnvironments: true} );
        config.findEnvironment( {} );
        assert.equal( false, config.getEnvironment());
    });

    it('search environment, empty options, debug true', function(){
        config.setOptions( { caseSensitiveEnvironments: true} );
        config.findEnvironment( { debug: true } );
        assert.equal( false, config.getEnvironment());
    });

    it('search environment, env var not found, debug true', function(){
        config.setOptions( { caseSensitiveEnvironments: true} );
        config.findEnvironment( { debug: true, env: "PONYCONFIG_ENV_MISSING", paths: [".", "test/data/missing-file", "test/data/env-file"], default: 'Default Environment' } );
        assert.equal( 'Test File Environment', config.getEnvironment());
    });

});

describe('useEnvironment', function(){
    it('initially should be false', function(){
        assert.equal( false, config.getEnvironment());
    });

    it('set environment with a string', function(){
        config.setOptions( { caseSensitiveEnvironments: true} );
        config.useEnvironment('Test Environment');
        assert.equal( 'Test Environment', config.getEnvironment());
    });

    it('set environment with a string, when switches configuration', function(){
        config.setOptions( { caseSensitiveEnvironments: true} );
        config.useEnvironment('Test Environment');
        config.when('Wrong Environment').useObject( { wrong : true } );
        config.when('Test Environment').useObject( { test : true } );
        assert.equal( undefined, config.get('wrong'), 'should not set "wrong"');
        assert.equal( true, config.get('test'), 'should set "test"');
    });

    it('set environment with a string, not clause -> is used', function(){
        config.setOptions( { caseSensitiveEnvironments: true} );
        config.useEnvironment('Test Environment');
        config.useObject( { always : true } );
        assert.equal( true, config.get('always'), 'should set "always"');
    });

    it('set environment with a string, always is used', function(){
        config.setOptions( { caseSensitiveEnvironments: true} );
        config.useEnvironment('Test Environment');
        config.always().useObject( { always : true } );
        assert.equal( true, config.get('always'), 'should set "always"');
    });

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

