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

    var CLI_OPTION_HELP = { path: "help", options: ["h","help"], description: "Show usage" };

    // ----------------------------
    // Configuration State, Module-Global by design
    // ----------------------------
    var _config = new Config();
    var _options = {};
    var _environment = false;               // by default no environment is selected
    var _whenEnvironments = false;
	var _interpreter = false;
	var _cliOptions = [ CLI_OPTION_HELP ];
	var _cliArgumentsPath = false;
	var _locked = false;

    // For Debug and Test - return state to initial, with optional alternative 'command line arguments'
    function _reset(){
        _config = new Config();
        _options = {};
        _environment = false;
        _whenEnvironments = false;
	    _locked = false;
		_cliOptions = [ CLI_OPTION_HELP ];
		_cliArgumentsPath = false;
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

    function _findEnvironment( search ){
        _environment = env.search( search );
		if( !_options.caseSensitiveEnvironments ) _environment = _environment.toUpperCase();
		return this;
    }

    function _useEnvironment( environment ){
    	if( !_options.caseSensitiveEnvironments ) environment = environment.toUpperCase();
        _environment = environment;
        return this;
    }

    function _getEnvironment(){
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
    // Set configuration from an OS environment variable
    // ----------------------------
    function _useEnvironmentVar( key, envVariableName ){
	    if( _shouldApplyConfig( _whenEnvironments ) && process.env[ envVariableName ] !== undefined ){
            _config.set( key, process.env[ envVariableName ], _keySourceHintFrom( 'USE-ENVIRONMENT', envVariableName, _whenEnvironments) );
        }
        _whenEnvironments = false;
        return this;
    }

    // ----------------------------
    // Set configuration from the command line
    // ----------------------------
    function _useCommandLineArguments( usageRules ){
	    if( _shouldApplyConfig( _whenEnvironments ) ){

			usageRules = _santizedUsageRules( usageRules );
			_parseCommandlineArguments( usageRules );

			if( _cliArgumentsPath ) _config.set( _cliArgumentsPath, _interpreter.arguments, _keySourceHintFrom( 'USE-COMMAND-LINE' ), _whenEnvironments );

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
                			console.error( "Error parsing input for option: ", usageRules[i].options );
							value = undefined;
						}
					}
                    _config.set( usageRules[i].path, value, _keySourceHintFrom( sourceHint, usageRules[i].options, _whenEnvironments) );
                }
            }
        }
        _whenEnvironments = false;
        return this;
    }

    function _parseOptionsParameter( options ){
    	var optionsComponent = options;
    	var parameterComponent = null;

    	var parameterMatch = options.match(/(^[^\[\<]*)(\[.*\])|(\<.*\>)/);
    	if( parameterMatch ){
    		optionsComponent = parameterMatch[1];
    		parameterComponent = parameterMatch[2];
		}

		var optionArray = optionsComponent.split(',');
		optionsArray = _.map( optionArray, function(string){
    		return string.replace(/-+/g, '').trim();
    	});

		return {
			options: optionsArray,
			parameter: parameterComponent
		};
	}


    function _cliOption( path, options, description, optionalDefaultValue, optionalParser ){
    	if( path === undefined || options == undefined ) throw new Error("CONFIG: cli option requires path and options parameters" );
		if( _.isArray( options )) options = options.join(',');

		if( typeof optionalDefaultValue === 'function' && arguments.length === 4 ){
			optionalParser = optionalDefaultValue;
			optionalDefaultValue = undefined;
		}

		var optionsSpec = _parseOptionsParameter( options );

		var usageRule = {
			path: path,
			options: optionsSpec.options,
			parameter: optionsSpec.parameter,
			description: description,
			defaultValue: optionalDefaultValue,
			parser: optionalParser
		};

		_cliOptions.push( usageRule );
		return this;
	}

	function _cliArguments( path ){
    	_cliArgumentsPath = path;
    	return this;
	}

	function _cliParse(){
    	_useCommandLineArguments( _cliOptions );
		return this;
	}

	function _optionsAsString( optionsArray ){
		var optionsAsStrings = [];
		for( var i=0; i < optionsArray.length; i++ ){
			var optionChars = optionsArray[i];
			if( optionChars.length === 1 ) optionsAsStrings.push( "-" + optionChars );
			else optionsAsStrings.push( "--" + optionChars );
		}
		return optionsAsStrings.join(", ");
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

	function _cliHelp(){

		console.log("Options:\n");
		for( var i=0; i < _cliOptions.length; i++ ){
			var opt = _cliOptions[i];
			var optionString = _optionsAsString( opt.options );
			if( opt.parameter ) optionString += " " + opt.parameter;

			var output = "  " + _rpad( optionString, 40 );
			if( opt.description !== undefined ) output += " " + opt.description;
			if( opt.defaultValue !== undefined ) output += ", Default=" + opt.defaultValue;
			console.log( output );
		}
		console.log( "\n" );
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
        _config.set( configKeyPath, configValue, _keySourceHintFrom('SET', optionalHint, _whenEnvironments ));
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
			var options = arrayWrap.wrap( usageRules[i].options );
			for( var j=0; j < options.length; j++ ){
				options[j] = options[j].split('-').join('');		// remove all dashes
			}
			usageRules[i].options = options;
		}
		return usageRules;
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
	exports.useCommandLineArguments = _useCommandLineArguments;
	exports.parseCommandLineArguments = _parseCommandlineArguments;
	exports.getCommandLineValue = _getCommandlineValue;
	exports.useCommandlineArguments = _useCommandLineArguments;
	exports.useCommandlineArguments = _useCommandLineArguments;
	exports.parseCommandlineArguments = _parseCommandlineArguments;
	exports.getCommandlineValue = _getCommandlineValue;
	exports.cliOption = _cliOption;
	exports.cliParse = _cliParse;
	exports.cliHelp = _cliHelp;
	exports.cliArguments = _cliArguments;
    exports.get = _get;
    exports.set = _set;
    exports.list = _list;
    exports.reset = _reset;
	exports.lock = _lock;
	exports.isEnvironment = _isEnvironment;
	exports.useFunction = _useFunction;
})();
