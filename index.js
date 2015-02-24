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

    // ----------------------------
    // Configuration State, Module-Global by design
    // ----------------------------
    var _configData = {};
    var _options = {};
    var _environment = false;               // by default no environment is selected
    var _whenEnvironments = false;
    var _parsedArgs = [];
	var _locked = false;

    function _reset( options ){
        _configData = {};
        _options = {};
        _environment = false;
        _whenEnvironments = false;
        _parsedArgs = [];
	    _locked = false;
        if( options && options.arguments ){
            _options._debugOverrideCommandlineArgs = options.arguments;
        }
    }

	// ----------------------------
	// lock config against changes
	// ----------------------------
	function _lock( exceptionOnLocked ){
		_locked = true;
		if( exceptionOnLocked !== undefined ){
			_options.exceptionOnLocked = exceptionOnLocked;
		}
		if( _options.debug ){
			console.log("CONFIG: Locked");
		}
	}
	
    // ----------------------------
    // Each application of config data overwrites previous values for that key
    // ----------------------------
    function _applyConfigData( configData ){
        _configData = _.defaults( configData, _configData );
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
	    if( _locked ){
		    if( _options.exceptionOnLocked ) throw Error( 'CONFIG: Cannot modify config after locking' );
		    else console.error('CONFIG: Cannot modify config after locking' );
		    return false;
	    }
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
	    if( _locked ){
		    if( _options.exceptionOnLocked ) throw Error( 'CONFIG: Cannot modify config after locking' );
		    else console.error('CONFIG: Cannot modify config after locking' );
		    return;
	    }
	    if( configKey.indexOf('.') > 0 ){
            _setValueForDottedKeyPath( _configData, configValue, configKey.split('.') );
        }else{
            _configData[ configKey ] = configValue;
        }
        return this;
    }

    // ----------------------------
    // Get config with a dot-path key, e.g., get( tree.height )
    // ----------------------------
    function _get( configKey, defaultValue ){
        if( !_.isString(configKey) ) return defaultValue;
        if( _configData === false ) return defaultValue;

        var configValue = false;
        if( configKey.indexOf('.') > 0 ){
            configValue = _getValueForDottedKeyPath( _configData, configKey.split('.') );
        }else{
            configValue = _configData[ configKey ];
        }

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
    // Helper to set config with a dot-path key
    // ----------------------------
    function _setValueForDottedKeyPath( targetData, configValue, configKeyPathComponents ){
        if( configKeyPathComponents.length === 1){
            targetData[ configKeyPathComponents ] = configValue;
        } else {
            var nextComponent = configKeyPathComponents.shift();
            if( typeof targetData[nextComponent] === 'undefined' ){
                targetData[nextComponent] = {};
            } else if( typeof targetData[nextComponent] !== 'object' ){
                throw new Error("Attempt to set value with path through non object at path: " + configKeyPathComponents );
            }

            _setValueForDottedKeyPath( targetData[nextComponent], configValue, configKeyPathComponents );
        }
    }

    // ----------------------------
    // Helper to get config with a dot-path key
    // ----------------------------
    function _getValueForDottedKeyPath( sourceData, configKeyPathComponents ){
        if( configKeyPathComponents.length === 1 ){
            return sourceData[configKeyPathComponents[0]];
        }else{
            var nextComponent = configKeyPathComponents.shift();

            if( typeof sourceData[nextComponent] === 'undefined' ) return undefined;

            if( typeof sourceData[nextComponent] !== 'object' ){
                throw new Error("Attempt to get value with path through non object at sub-path: " + configKeyPathComponents );
            }
            return _getValueForDottedKeyPath( sourceData[nextComponent], configKeyPathComponents );
        }
    }

    // ----------------------------
    // Helper to map command line parameters to config set's
    // argSpec is as follows
    // { options: [ '-f', '--file' ], argument: true, required: true }
    // ----------------------------
    function _processArgument( configKey, argSpec ){
        var value = _commandlineProcessor.value( argSpec );

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
	exports.lock = _lock;
    exports.parsedArgs = _parsedArgs;

})();
