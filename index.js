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
    var fs = require('fs');
    var _ = require('lodash');
	var fsCoalesce = require('fs-coalesce');

    // ----------------------------
    // Local dependencies
    // ----------------------------
    var env = require('./lib/env');
    var argv = require('./lib/argv');
    var Config = require('./lib/Config');
    var arrayWrap = require('./lib/array-wrap');

    // ----------------------------
    // Configuration State, Module-Global by design
    // ----------------------------
    var _config = new Config();
    var _options = {};
    var _environment = false;               // by default no environment is selected
    var _whenEnvironments = false;
	var _interpreter = false;

	var _locked = false;

    // For Debug and Test - return state to initial, with optional alternative 'command line arguments'
    function _reset(){
        _config = new Config();
        _options = {};
        _environment = false;
        _whenEnvironments = false;
	    _locked = false;
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
        _config.lock();
	}
	
    // ----------------------------
    // Options:
    //  debug - logs configuration changes
    //  exceptionOnLocked - throw exception on attempt to set property after lock
    //  cloneWhenLocked - return clones of all objects to enforce lock
    //  noColor - no color in list output
    //  customCommandlineArguments - command line option string to use instead of process.args
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

        environments = arrayWrap.wrap( environments );

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
    // USE Clauses - Configuration sources
    // ----------------------------



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
            _config.set( key, process.env[ envVariableName ]);
        }
        _whenEnvironments = false;
        return this;
    }

    // ----------------------------
    // Set configuration from the command line
    // ----------------------------
    function _useCommandLineArguments( usageRules ){
	    if( _shouldApplyConfig( _whenEnvironments ) ){

			_parseCommandlineArguments( usageRules );

            usageRules = arrayWrap.wrap( usageRules );
            for( var i=0; i < usageRules.length; i++ ){
                var value = _getCommandlineValue( usageRules[i].path );
                if( value !== undefined ){
                    _config.set( usageRules[i].path, value, 'USE-COMMAND-LINE:' + usageRules[i].options );
                }
            }
        }
        _whenEnvironments = false;
        return this;
    }

	// ----------------------------
	// Parse Commandline Arguments. Alternative to 'use'.  Parses command line without applying values to config
	// ----------------------------
	function _parseCommandlineArguments( usageRules ){
		var options = { "arguments" : _options.customCommandlineArguments };
		_interpreter = new argv.Interpreter( usageRules, options );
		return this;
	}


	// ----------------------------
    // Set configuration using an object
    // ----------------------------
    function _useObject( configData ){
	    if( _shouldApplyConfig( _whenEnvironments ) ){
            _config.set( '.', configData, 'USE-OBJECT' );
        }
        _whenEnvironments = false;
        return this;
    }

    // ----------------------------
    // Log the current configuration
    // ----------------------------
    function _list( options ){
        options = options || {};
        if( options.noColor === undefined ) options.noColor = _options.noColor;
        if( options.outputStream === undefined ) options.outputStream = console.log;
	    var chalk = require('chalk');
		
	    chalk.enabled = ! options.noColor;

        var header = chalk.white.bold('CONFIG');
        if( _environment ) header += ': [' + chalk.green.bold( _environment ) + ']';
        if( _locked ) header += ' [' + chalk.red.bold( 'LOCKED' ) + ']';
        options.outputStream( header );

        _config.list( options );

        return this;
    }

    // ----------------------------
    // Set configuration using an dot-path key, eg. (tree.height, 25)
    // ----------------------------
    function _set( configKeyPath, configValue ){
        if( _locked ){
            if( _options.exceptionOnLocked ) throw Error( 'CONFIG: Cannot modify config after locking' );
            else console.error('CONFIG: Cannot modify config after locking' );
            return false;
        }
        _config.set( configKeyPath, configValue, 'SET' );
        return this;
    }

    // ----------------------------
    // Get config with a dot-path key, e.g., get( tree.height )
    // ----------------------------
    function _get( configKeyPath, defaultValue ){
        var value = _config.get( configKeyPath, defaultValue );
        if( _locked && _options.cloneWhenLocked ){
            if( ! (value instanceof Function) ){        // function mutability is strange, function may have state, and this preserves state
                value = _.cloneDeep( value );
            }
        }
        return value;
    }


    // ----------------------------
    // Helper to parse a config file
    // ----------------------------
    function _loadAndApplyConfigFile( configFileName ){
        var configFileData = false;

	    var configFileNameArray = arrayWrap.wrap( configFileName );
	    var configFileContents = fsCoalesce.readFirstFileToExistSync( configFileNameArray );
	    
	    if( !configFileContents ) return;
	    
        try{
            configFileData = JSON.parse( configFileContents );
            if( _options.debug ) console.log('CONFIG: [' + _environment + '] Loaded config from file:', configFileName );
        } catch( error ){
            if( error.code !== 'ENOENT' ){		// file doesn't exist, skip it
                console.error('CONFIG: Error reading file:', configFileName, error );
            }
        }

        if( configFileData ){
            _config.set( '.', configFileData, 'USE-FILE:' + configFileName );
        }
    }

	// ----------------------------
	// Fetch the value of a command line argument by config key path without applying it to the config
	// ----------------------------
	function _getCommandlineValue( configKeyPath ){
		if( ! _interpreter ) {
			console.warn( "CONFIG: call parseCommandlineArguments( usage ) before getCommandlineValue" );
			return undefined;
		}
		return _interpreter.values[ configKeyPath ];
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
	exports.parseCommandlineArguments = _parseCommandlineArguments;
	exports.getCommandlineValue = _getCommandlineValue;

})();
