// Pony Config Configuration Module
//
// (c) 2014 PonyCode Corporation
// License to distribute freely
//
// TODO
// log when set dot-path is extending objects
// allow a key path for where a file or object is loaded
// add debug mode to trace key overwrites (probably requires rewriting 'defaults')
// load configuration from command line parameters
// ------------------------------------------------------

( function(){

    // ----------------------------
    // External dependencies
    // ----------------------------
    var _ = require('underscore');
    var fs = require('fs');

    // ----------------------------
    // Local dependencies
    // ----------------------------
    var env = require('./lib/env.js');
    var argv = require('./lib/argv.js');
    var obj = require('./lib/obj.js');

    // ----------------------------
    // Configuration State, Module-Global by design
    // ----------------------------
    var _configData = {};
    var _options = {};
    var _environment = false;               // by default no environment is selected
    var _whenEnvironments = false;
    var _parsedArgs = [];

    function _reset( options ){
        _configData = {};
        _options = {};
        _environment = false;
        _whenEnvironments = false;
        _parsedArgs = [];
        if( options && options.arguments ){
            _options._debugOverrideCommandlineArgs = options.arguments;
        }
    }

    // ----------------------------
    // Each application of config data overwrites previous values for that key
    // ----------------------------
    function _applyConfigData( configData ){
        _configData = obj.merge( _configData, configData );
    }

    // ----------------------------
    // Options:
    //  debug - logs configuration changes
    // ----------------------------
    function _setOptions( options ){
        _options = options || {};
        return this;
    }

    // ----------------------------
    // Environment Switching:
    // Ignores config settings that aren't for the current environment
    // ----------------------------

    function _findEnvironment( search ){
        _environment = env.search( search );
        return this;
    }

    function _useEnvironment( environment ){
        _environment = environment;
        return this;
    }

    function _getEnvironment(){
        return _environment;
    }

    function _shouldApplyConfig( environments ){

        if( environments === undefined || environments === false ) return true; // unspecified environments are always added

        if( _.isString( environments )) environments = [ environments ];

        for( var i = 0; i < environments.length; i++){
            var env = environments[i];
            if( env === _environment ){
                return true;
            }
        }

        return false;
    }

    // ----------------------------
    // When Clause - use to set environment context for useX commands
    // ----------------------------
    function _when( environments ){
        _whenEnvironments = environments;
        return this;
    }

    // ----------------------------
    // Always Clause - use to set environment context for useX commands
    // ----------------------------
    function _always(){
        _whenEnvironments = false;
        return this;
    }

    // ----------------------------
    // Set configuration from a file
    // ----------------------------
    function _useFile( configFileName ){
        if( _shouldApplyConfig( _whenEnvironments ) ){
            _loadAndApplyConfigFile( configFileName );
        }
        _whenEnvironments = false;
        return this;
    }

    // ----------------------------
    // Set configuration from an OS environment variable
    // ----------------------------
    function _useEnvironmentVar( key, envVariableName ){
        if( _shouldApplyConfig( _whenEnvironments ) && process.env[ envVariableName ] !== undefined ){
            _set( key, process.env[ envVariableName ] );
        }
        _whenEnvironments = false;
        return this;
    }

    // ----------------------------
    // Set configuration from the command line
    // ----------------------------
    function _useCommandLineArguments( usageRules ){
        if( _shouldApplyConfig( _whenEnvironments ) ){

            var options = {};
            if( _options._debugOverrideCommandlineArgs ){
                options = { "arguments" : _options._debugOverrideCommandlineArgs };
            }

            var interpreter = new argv.Interpreter( usageRules, options );
            _parsedArgs = interpreter.args;

            function _setValueForPath( path ){
                var value = interpreter.values[ path ];
                if( value ){
                    _set( path, value );
                }
            }

            if(_.isArray( usageRules )){
                for( var i=0; i < usageRules.length; i++ ){
                    _setValueForPath( usageRules[i].path );
                }
            } else if(_.isObject( usageRules )){
                _setValueForPath( usageRules.path );
            }
        }
        _whenEnvironments = false;
        return this;
    }

    // ----------------------------
    // Set configuration using an object
    // ----------------------------
    function _useObject( configData ){
        if( _shouldApplyConfig( _whenEnvironments ) ){
            _applyConfigData( configData );
        }
        _whenEnvironments = false;
        return this;
    }

    // ----------------------------
    // Log the current configuration
    // ----------------------------
    function _list(){
        var keys = _.keys( _configData );
        console.log('------------------------------------');
        if( _environment ) {
            console.log('CONFIG: [' + _environment + ']');
        }else{
            console.log('CONFIG:');
        }
        for( var i = 0; i < keys.length; i++ ){
            var key = keys[i];
            console.log( '\t' + key + ': ' + require('util').inspect(_configData[key], true, 10) );
        }
        console.log('------------------------------------');
        return this;
    }

    // ----------------------------
    // Set configuration using an dot-path key, eg. (tree.height, 25)
    // ----------------------------
    function _set( configKey, configValue ){
        obj.set( _configData, configKey, configValue );
        return this;
    }

    // ----------------------------
    // Get config with a dot-path key, e.g., get( tree.height )
    // ----------------------------
    function _get( configKey, defaultValue ){
        var configValue = obj.get( _configData, configKey );
        return ( configValue === undefined ) ?  defaultValue : configValue;
    }


    // ----------------------------
    // Helper to parse a config file
    // ----------------------------
    function _loadAndApplyConfigFile( configFileName ){
        var configFileData = false;

        try{
            var configFileContents = fs.readFileSync( configFileName, { 'encoding' : 'utf8' } );
            configFileData = JSON.parse( configFileContents );
            if( _options.debug ) console.log('CONFIG: [' + _environment + '] Loaded config from file:', configFileName );
        } catch( error ){
            if( error.code !== 'ENOENT' ){		// file doesn't exist, skip it
                console.error('CONFIG: Error reading file:', configFileName, error );
            }
        }

        if( configFileData ){
            _applyConfigData( configFileData );
        }
    }

    // ----------------------------
    // Expose public functions
    // ----------------------------
    exports.setOptions = _setOptions;
    exports.findEnvironment = _findEnvironment;
    exports.getEnvironment = _getEnvironment;
    exports.useEnvironment = _useEnvironment;
    exports.when = _when;
    exports.always = _always;
    exports.useFile = _useFile;
    exports.useObject = _useObject;
    exports.useEnvironmentVar = _useEnvironmentVar;
    exports.useCommandLineArguments = _useCommandLineArguments;
    exports.get = _get;
    exports.set = _set;
    exports.list = _list;
    exports.reset = _reset;
    exports.parsedArgs = _parsedArgs;

})();
