var assert = require("assert");

var config = require('../index');

describe('Intantiate', function(){
    config.reset();
    it('should return an object', function(){
        assert.equal( typeof config, 'object');
    });
});

describe('Get and Set Paths', function(){
    it('set simple path', function(){
        config.reset();
        config.set( 'root', 'value' );
        assert.equal( 'value', config.get('root') );
    });

    it('set path of new object', function(){
        config.reset();
        config.set('root.sub1', 'value' );
        assert.equal( 'value', config.get('root.sub1') );
    });

    it('set deep path of new object', function(){
        config.reset();
        config.set('root.sub1.sub2.sub3', 'value' );
        assert.equal( 'value', config.get('root.sub1.sub2.sub3') );
    });

    it('set extends', function(){
        config.reset();
        config.set('root.sub1', 'value_1' );
        config.set('root.sub2', 'value_2' );
        assert.equal( 'value_1', config.get('root.sub1') );
        assert.equal( 'value_2', config.get('root.sub2') );
    });

    it('set overwrites', function(){
        config.reset();
        config.set('root', 'value_1' );
        config.set('root', 'value_2' );
        assert.equal( 'value_2', config.get('root') );
    });

});

describe('Get defaults', function(){
    it('missing key no default', function(){
        config.reset();
        assert.equal( undefined, config.get('root') );
    });

    it('missing key with default false', function(){
        config.reset();
        assert.equal( false, config.get('root', false) );
    });

    it('missing key with default true', function(){
        config.reset();
        assert.equal( true, config.get('root', true) );
    });

    it('missing key with default object', function(){
        config.reset();
        assert.deepEqual( {"key" : "value"}, config.get('root', {"key" : "value"} ));
    });

    it('present key returns own value', function(){
        config.reset();
        config.set( "key", "value" );
        assert.equal( "value", config.get('key', "default" ));
    });
});

describe('useObject', function(){
    it('empty object should get undefined', function(){
        config.reset();
        assert.equal( undefined, config.get('missing') );
        assert.equal( undefined, config.get('missing.path') );
    });

    it('simple object should be set', function(){
        config.reset();
        config.useObject({ root_1  : true });
        config.useObject({ root_2  : false });

        assert.equal( true, config.get('root_1') );
        assert.equal( false, config.get('root_2') );
    });

    it('missing objects should be undefined', function(){
        config.reset();
        config.useObject({ root_1  : true });

        assert.equal( undefined, config.get('root_2') );
    });

    it('complex object should be set', function(){
        config.reset();
        config.useObject({ root_1 : { "sub_1" : { sub_2 : true }} });

        assert.equal( true, config.get('root_1.sub_1.sub_2') );
    });
});

describe('useObject', function(){
    it('use a file containing an object', function(){
        config.reset();
        config.useFile('data/config_1.json');
        assert.equal( 'r1_value_1', config.get('root_node_1') );
        assert.equal( 'r2_s2_value_1', config.get('root_node_2.sub_node_2') );
    });

    it('use file, two files containing an object, merged', function(){
        config.reset();
        config.useFile('data/config_1.json');
        config.useFile('data/config_2.json');
        assert.equal( 'r1_value_2', config.get('root_node_1'), 'root node should be replaced' );
        /* FAILS, FEATURE? */ //assert.equal( 'r2_s1_value_1', config.get('root_node_2.sub_node_1'), 'root node 2 sub_node1 should be original' );
        assert.equal( 'r2_s2_value_2', config.get('root_node_2.sub_node_2'), 'root node 2 sub_value2 should be replaced' );
        assert.equal( 'r3_value_1', config.get('root_node_3'), 'root node 3 should be original' );
        assert.equal( 'r4_value_2', config.get('root_node_4'), 'root node 4 should be new' );
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
        config.reset();
        config.useEnvironmentVar( 'test.trueValue', 'PONYCONFIG_TRUE');
        config.useEnvironmentVar( 'test.falseValue', 'PONYCONFIG_FALSE');
        config.useEnvironmentVar( 'test.missingValue', 'PONYCONFIG_MISSING');
        assert.equal( true, config.get( 'test.trueValue' ));
        assert.equal( false, config.get( 'test.falseValue'));
        assert.equal( undefined, config.get( 'test.missingValue'));

    });
});

//-----------
// Expects in the environment variables:
// "PONYCONFIG_ENV=ENVVAR_ENVIRONMENT" and
// and no definition for PONYCONFIG_ENV_MISSING
//-----------

describe('findEnvironment', function(){

    it('search environment, default', function(){
        config.reset();
        config.findEnvironment( { default: 'Default Environment' } );
        assert.equal( 'Default Environment', config.getEnvironment());
    });

    it('search environment, missing file', function(){
        config.reset();
        config.findEnvironment( { paths: "data/missing-file", default: 'Default Environment' } );
        assert.equal( 'Default Environment', config.getEnvironment());
    });

    it('search environment, single file', function(){
        config.reset();
        config.findEnvironment( { paths: "data/env-file", default: 'Default Environment' } );
        assert.equal( 'Test File Environment', config.getEnvironment());
    });

    it('search environment, search file paths, one path', function(){
        config.reset();
        config.findEnvironment( { paths: ["data/env-file"], default: 'Default Environment' } );
        assert.equal( 'Test File Environment', config.getEnvironment());
    });

    it('search environment, search file paths, multiple paths', function(){
        config.reset();
        config.findEnvironment( { paths: [".", "data/missing-file", "data/env-file"], default: 'Default Environment' } );
        assert.equal( 'Test File Environment', config.getEnvironment());
    });

    it('search environment, env var not found', function(){
        config.reset();
        config.findEnvironment( { env: "PONYCONFIG_ENV_MISSING", paths: [".", "data/missing-file", "data/env-file"], default: 'Default Environment' } );
        assert.equal( 'Test File Environment', config.getEnvironment());
    });

    it('search environment, env var used', function(){
        config.reset();
        config.findEnvironment( { env: "PONYCONFIG_ENV", paths: [".", "data/missing-file", "data/env-file"], default: 'Default Environment' } );
        assert.equal( 'ENVVAR_ENVIRONMENT', config.getEnvironment());
    });

});

describe('useEnvironment', function(){
    it('initially should be false', function(){
        config.reset();
        assert.equal( false, config.getEnvironment());
    });

    it('set environment with a string', function(){
        config.reset();
        config.useEnvironment('Test Environment');
        assert.equal( 'Test Environment', config.getEnvironment());
    });

    it('set environment with a string, when switches configuration', function(){
        config.reset();
        config.useEnvironment('Test Environment')
        config.when('Wrong Environment').useObject( { wrong : true } );
        config.when('Test Environment').useObject( { test : true } );
        assert.equal( undefined, config.get('wrong'), 'should not set "wrong"');
        assert.equal( true, config.get('test'), 'should set "test"');
    });

    it('set environment with a string, not clause -> is used', function(){
        config.reset();
        config.useEnvironment('Test Environment')
        config.useObject( { always : true } );
        assert.equal( true, config.get('always'), 'should set "always"');
    });

    it('set environment with a string, always is used', function(){
        config.reset();
        config.useEnvironment('Test Environment')
        config.always().useObject( { always : true } );
        assert.equal( true, config.get('always'), 'should set "always"');
    });

});

