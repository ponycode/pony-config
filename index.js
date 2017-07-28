// Pony Config Configuration Module
//
// (c) 2014 PonyCode Corporation
// License to distribute freely
//
// TODO
// let user add on-help function of their own so we don't have to process.exit for them
// log when set dot-path is extending objects
// allow a key path for where a file or object is loaded
// add debug mode to trace key overwrites (probably requires rewriting 'defaults')
// ------------------------------------------------------

( function(){

    // ----------------------------
    // External dependencies
    // ----------------------------
    var fs = require('fs');
    var _ = require('lodash');
	var fsCoalesce = require('fs-coalesce');
	var CLI_FLAG_HELP = { path: "__cli_help", flags: ["h","help"], description: "Show usage" };

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
	var _cliFlags = [];
	var _cliArgumentsPath = false;
	var _locked = false;
	var _onHelpCallback = false;

    // For Debug and Test - return state to initial, with optional alternative 'command line arguments'
    function _reset(){
        _config = new Config();
        _options = {};
        _environment = false;
        _whenEnvironments = false;
	    _locked = false;
		_cliFlags = [];
		_cliArgumentsPath = false;
		_onHelpCallback = false;
		_cliUsageMessage = false;
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
	//
    // ----------------------------
    function _setOptions( options ){
        _options = options || {};
        return this;
    }

    // ----------------------------
    // Environment Switching:
    // Ignores config settings that aren't for the current environment
    // ----------------------------

    function _findRuntimeEnvironment( search ){
        _environment = env.search( search );
		if( !_options.caseSensitiveEnvironments && _.isString( _environment )) _environment = _environment.toUpperCase();
		return this;
    }

    function _useRuntimeEnvironment( environment ){
    	if( !_options.caseSensitiveEnvironments ) environment = environment.toUpperCase();
        _environment = environment;
        return this;
    }

    function _getRuntineEnvironment(){
        return _environment;
    }

    function _isEnvironment( environment ){
		if( !_options.caseSensitiveEnvironments ) return ( environment.toUpperCase() === _environment.toUpperCase());
		else return ( environment === _environment );
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
			if( !_options.caseSensitiveEnvironments ) env = env.toUpperCase();
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
        _whenEnvironments = arrayWrap.wrap( environments );
		if( !_options.caseSensitiveEnvironments ) _whenEnvironments = _.map( _whenEnvironments, function( e ){ return e.toUpperCase() });
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

	function _keySourceHintFrom( method, source, environment ){
		var hints = [];
		if( method ) hints.push( method );
		if( source ) hints.push( source );
		if( environment ) hints.push( "WHEN " + environment );

		return hints.join(' ');
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
	// Set configuration by evaluating a function conditional on the when clause
	// ----------------------------
	function _useFunction( aFunction ){
		if( _shouldApplyConfig( _whenEnvironments ) ){
			aFunction();
		}
		_whenEnvironments = false;
		return this;
	}

	// ----------------------------
	// Set configuration by requiring a module and applying the object on the when clause
	// NOTE: Caller should fully resolve path else require will attempt to locate relative to THIS module
	// ----------------------------
	function _useRequire( module ){
		if( _shouldApplyConfig( _whenEnvironments ) ){
			var object = require( module );
			_useObject( object );
		}
		_whenEnvironments = false;
		return this;
	}

    // ----------------------------
    // Set configuration from an OS environment variable
    // ----------------------------
    function _env( key, envVariableName ){
	    if( _shouldApplyConfig( _whenEnvironments ) && process.env[ envVariableName ] !== undefined ){
            _config.set( key, process.env[ envVariableName ], _keySourceHintFrom( 'USE-ENVIRONMENT', envVariableName, _whenEnvironments) );
        }
        _whenEnvironments = false;
        return this;
    }

    // ----------------------------
    // Set configuration from the command line
    // ----------------------------
    function _processCommandLineArguments( usageRules ){
		_parseCommandlineArguments( usageRules );

		if( _cliArgumentsPath ) _config.set( _cliArgumentsPath, _interpreter.arguments, _keySourceHintFrom( 'USE-COMMAND-LINE' ), _whenEnvironments );

		if( _getCommandlineValue( CLI_FLAG_HELP.path ) ){
			return _cliPerformHelp();
		}

		for( var i=0; i < usageRules.length; i++ ){
			var sourceHint = 'USE-COMMAND-LINE';
			var value = _getCommandlineValue( usageRules[i].path );
			if( value === undefined && usageRules[i].defaultValue !== undefined ){
				sourceHint += '(DEFAULT)';
				value = usageRules[i].defaultValue;
			}
			if( value !== undefined ){
				if( usageRules[i].parser ){
					try{
						value = usageRules[i].parser.call( null, value );
					}catch( error ){
						console.error( "Error parsing input for option: ", usageRules[i].flags );
						value = undefined;
					}
				}
				_config.set( usageRules[i].path, value, _keySourceHintFrom( sourceHint, usageRules[i].flags, _whenEnvironments) );
			}
		}
        return this;
    }

    function _parseFlagsParameter( flags ){
    	var flagsComponent = flags;
    	var parameterComponent = null;

    	var parameterMatch = flags.match(/(^[^\[\<]*)(\[.*\])|(\<.*\>)/);
    	if( parameterMatch ){
    		flagsComponent = parameterMatch[1];
    		parameterComponent = parameterMatch[2];
		}

		var flagsArray = flagsComponent.split(',');
		flagsArray = _.map( flagsArray, function(string){
    		return string.replace(/-+/g, '').trim();
    	});

		return {
			flags: flagsArray,
			parameter: parameterComponent
		};
	}

	function _cliPerformHelp(){
    	let helpMessage = _cliHelpMessage();
    	if( _onHelpCallback ) return _onHelpCallback( helpMessage );

    	// Default help behavior
    	console.log( helpMessage );
    	process.exit(0);
	}

	function _cliUsage( message ){
    	if( _.isString( message )) throw new Error( "CONFIG: cli usage requires a message string as input" );
		_cliUsageMessage = message;
    	return this;
	}

	function _cliOnHelp( aFunction ){
		if( _.isFunction( aFunction )) throw new Error( "CONFIG: cliOnHelp requires a function as input" );
		_onHelpCallback = aFunction;
		return this;
	}

    function _cliFlag( path, flags, description, optionalDefaultValue, optionalParser ){
		if( path === undefined || flags == undefined ) throw new Error( "CONFIG: cli option requires path and flags parameters" );
		if( _.isArray( flags ) ) flags = flags.join( ',' );

		if( typeof optionalDefaultValue === 'function' && arguments.length === 4 ){
			optionalParser = optionalDefaultValue;
			optionalDefaultValue = undefined;
		}

		var flagsSpec = _parseFlagsParameter( flags );

		var usageRule = {
			path: path,
			flags: flagsSpec.flags,
			parameter: flagsSpec.parameter,
			description: description,
			defaultValue: optionalDefaultValue,
			parser: optionalParser
		};

		_cliFlags.push( usageRule );
		return this;
	}

	function _cliArguments( path ){
		_cliArgumentsPath = path;
    	return this;
	}

	function _cliParse(){
		if( _shouldApplyConfig( _whenEnvironments ) ){
			_cliFlags.push( CLI_FLAG_HELP );
			_processCommandLineArguments( _cliFlags );
		}
    	_whenEnvironments = false;
		return this;
	}

	function _flagsAsString( flagsArray ){
		var flagsAsStrings = [];
		for( var i=0; i < flagsArray.length; i++ ){
			var flagsChars = flagsArray[i];
			if( flagsChars.length === 1 ) flagsAsStrings.push( "-" + flagsChars );
			else flagsAsStrings.push( "--" + flagsChars );
		}
		return flagsAsStrings.join(", ");
	}

	var PAD = "                                                                                                   ";

	function _lpad( string, padTo ){
		var padWidth = padTo - string.length;
		if( padWidth > 0 ) string = PAD.substring( 0, padWidth ) + string;
		return string;
	}

	function _rpad( string, padTo ){
		var padWidth = padTo - string.length;
		if( padWidth > 0 ) string = string + PAD.substring( 0, padWidth );
		return string;
	}

	function _cliHelpMessage(){
		var output = "";
		if( _cliUsageMessage ) output += _cliUsageMessage + "\n";
		output += "Flags:";
		for( var i=0; i < _cliFlags.length; i++ ){
			var opt = _cliFlags[i];
			var flagsString = _flagsAsString( opt.flags );
			if( opt.parameter ) flagsString += " " + opt.parameter;

			output = "  " + _rpad( flagsString, 40 );
			if( opt.description !== undefined ) output += " " + opt.description;
			if( opt.defaultValue !== undefined ) output += ", Default=" + opt.defaultValue;
			output += "\n";
		}
		output += "\n";
		return output;
	}

	// ----------------------------
	// Parse Commandline Arguments. Alternative to 'use'.  Parses command line without applying values to config
	// ----------------------------
	function _parseCommandlineArguments( usageRules ){
		usageRules = _santizedUsageRules( usageRules );
		var options = { "arguments" : _options.customCommandlineArguments };
		_interpreter = new argv.Interpreter( usageRules, options );
		return this;
	}

	// ----------------------------
    // Set configuration using an object
    // ----------------------------
    function _useObject( configData, optionalHint ){
	    if( _shouldApplyConfig( _whenEnvironments ) ){
            _config.set( '.', configData, _keySourceHintFrom( 'USE-OBJECT', optionalHint, _whenEnvironments) );
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
    function _set( configKeyPath, configValue, optionalHint ){
        if( _locked ){
            if( _options.exceptionOnLocked ) throw Error( 'CONFIG: Cannot modify config after locking' );
            else console.error('CONFIG: Cannot modify config after locking' );
            return false;
        }
		if( _shouldApplyConfig( _whenEnvironments ) ){
			_config.set( configKeyPath, configValue, _keySourceHintFrom( 'SET', optionalHint, _whenEnvironments ) );
		}
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
            _config.set( '.', configFileData, _keySourceHintFrom( 'USE-FILE', configFileName, _whenEnvironments ));
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
	// Sanitize - and -- from usage rules
	// ----------------------------
	function _santizedUsageRules( usageRules ){
		usageRules = arrayWrap.wrap( usageRules );
		for( var i=0; i < usageRules.length; i++ ){
			var flags = arrayWrap.wrap( usageRules[i].flags );
			for( var j=0; j < flags.length; j++ ){
				flags[j] = flags[j].split('-').join('');		// remove all dashes
			}
			usageRules[i].flags = flags;
		}
		return usageRules;
	}

	// ----------------------------
    // Expose public functions
    // ----------------------------
    exports.options = _setOptions;
    exports.findRuntimeEnvironment = _findRuntimeEnvironment;
    exports.getRuntimeEnvironment = _getRuntineEnvironment;
    exports.useRuntimeEnvironment = _useRuntimeEnvironment;
    exports.when = _when;
    exports.always = _always;
    exports.file = _useFile;
    exports.object = _useObject;
    exports.env = _env;
	exports.cliFlag = _cliFlag;
	exports.cliParse = _cliParse;
	exports.cliHelpMessage = _cliHelpMessage;
	exports.cliArguments = _cliArguments;
	exports.cliOnHelp = _cliOnHelp;
	exports.cliUsage = _cliUsage;
    exports.get = _get;
    exports.set = _set;
    exports.list = _list;
    exports.reset = _reset;
	exports.lock = _lock;
	exports.isRuntimeEnvironment = _isEnvironment;
	exports.function = _useFunction;
	exports.require = _useRequire;
})();
