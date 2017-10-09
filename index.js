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

	"use strict";

    // ----------------------------
    // External dependencies
    // ----------------------------
    var _ = require('lodash');
	var fsCoalesce = require('fs-coalesce');
	var path = require('path');


    // ----------------------------
    // Local dependencies
    // ----------------------------
    var envSearch = require('./lib/env-search');
    var argv = require('./lib/argv');
    var ConfigStore = require('./lib/ConfigStore');
    var arrayWrap = require('./lib/array-wrap');
	var stdin = require('./lib/stdin');

    var CLI_FLAG_HELP_PATH = "$CONFIG_SHOW_HELP";

	/**
	 * Configuration State, Module-Global by design
	 *
	 * @type {Config}
	 * @private
	 */
	var _config = new Config();
	Object.defineProperty( _config, '_configStore', { enumerable: false });
	Object.defineProperty( _config, '_options', { enumerable: false });
	Object.defineProperty( _config, '_environment', { enumerable: false });
	Object.defineProperty( _config, '_whenEnvironments', { enumerable: false });
	Object.defineProperty( _config, '_interpreter', { enumerable: false });
	Object.defineProperty( _config, '_cliFlags', { enumerable: false });
	Object.defineProperty( _config, '_cliArgumentsPath', { enumerable: false });
	Object.defineProperty( _config, '_locked', { enumerable: false });
	Object.defineProperty( _config, '_onHelpCallback', { enumerable: false });
	Object.defineProperty( _config, '_cliUsageMessage', { enumerable: false });

	function Config(){
		this._configStore = new ConfigStore();
		this._options = {};
		this._environment = false;               // by default no environment is selected
		this._whenEnvironments = false;
		this._interpreter = false;
		this._cliFlags = [];
		this._cliArgumentsPath = false;
		this._locked = false;
		this._onHelpCallback = false;
		this._cliUsageMessage = false;
		this._cliStdinDescription = false;
		this._cliStdinFlagSpec = false;
		this._cliStdinBufferData = false;
	}


	/**
	 * For Debug and Test - return state to initial, with optional alternative command line arguments
	 * @private
	 */
	Config.prototype.reset = function(){
		this._configStore = new ConfigStore();
		this._options = {};
		this._environment = false;               // by default no environment is selected
		this._whenEnvironments = false;
		this._interpreter = false;
		this._cliFlags = [];
		this._cliArgumentsPath = false;
		this._locked = false;
		this._onHelpCallback = false;
		this._cliUsageMessage = false;
		this._cliStdinFlagSpec = false;
		this._cliStdinBufferData = false;
	};

	/**
	 * lock against changes
	 * @param exceptionOnLocked - if true throw exception on mutation attempt - slower
	 */
	Config.prototype.lock = function( exceptionOnLocked ){
		this._locked = true;
		if( exceptionOnLocked !== undefined ){
			this._options.exceptionOnLocked = exceptionOnLocked;
		}
		if( this._options.debug ){
			console.log("CONFIG: Locked");
		}
		this._configStore.lock();
		return this;
	};

	/**
	 *
	 * @param options
	 *
	 * Options:
	 *  debug - logs configuration changes
	 *  exceptionOnLocked - throw exception on attempt to set property after lock
	 *  cloneWhenLocked - return clones of all objects to enforce lock
	 *  noColor - no color in list output
	 *
	 * @return {Config}
	 */
	Config.prototype.options = function( options ){
        this._options = options || {};
        return this;
    };

	/**
	 * Search for the runtime environment indicator
	 * @param search - indicates where to search for env indicator
	 * @return {Config}
	 */
    Config.prototype.findRuntimeEnvironment = function( search ){
        this._environment = envSearch( search );
		if( !this._options.caseSensitiveEnvironments && _.isString( this._environment )) this._environment = this._environment.toUpperCase();
		return this;
    };

	/**
	 * Set the runtime environment
	 * @param environment - string
	 * @return {Config}
	 *
	 * @see findRuntimeEnvironment
	 */
	Config.prototype.useRuntimeEnvironment = function( environment ){
		if( environment === void 0 || environment === false || environment === null ){
			this._environment = false;
			return this;
		}
		if( !_.isString( environment )) throw new Error("Environment must be a string or undefined");
    	if( !this._options.caseSensitiveEnvironments ) environment = environment.toUpperCase();
        this._environment = environment;
        return this;
    };

	/**
	 * Returns the runtime environment that has been selected
	 * @return {String} environment
	 */
	Config.prototype.getRuntimeEnvironment = function(){
        return this._environment;
    };

	/**
	 * Compares input to current selection
	 *
	 * Takes into account case sensitivity options @see setOptions
	 *
	 * @param environment
	 * @return {boolean} true if environment matches selected environment
	 */
	Config.prototype.isRuntimeEnvironment = function( environment ){
		if( !this._options.caseSensitiveEnvironments ) return ( environment.toUpperCase() === this._environment.toUpperCase());
		else return ( environment === this._environment );
	};

	/**
	 * Determine if the config operation should be applied
	 * Based on locked state and environment comparison
	 *
	 * @see when clauses
	 * @return {boolean} true if all conditions match
	 * @private
	 */
	Config.prototype._shouldApplyConfig = function(){
		var self = this;
	    if( self._locked ){
		    if( self._options.exceptionOnLocked ) throw Error( 'CONFIG: Cannot modify config after locking' );
		    else console.error('CONFIG: Cannot modify config after locking' );
		    return false;
	    }
	    var environments = self._whenEnvironments;
        if( environments === undefined || environments === false ) return true; // unspecified environments are always added

        environments = arrayWrap.wrap( environments );

        var match = false;

        _.each( environments, function( env ){
			if( !self._options.caseSensitiveEnvironments ) env = env.toUpperCase();
			if( env === self._environment ){
				match = true;
				return false;
			}
		});

        return match;
    };

	/**
	 * When Clause - use to set environment context for useX commands
	 *
	 * @param environments - process next function for these environments
	 * @return {Config}
	 */
    Config.prototype.when = function( environments ){
        this._whenEnvironments = arrayWrap.wrap( environments );
		if( !this._options.caseSensitiveEnvironments ) this._whenEnvironments = _.map( this._whenEnvironments, function( e ){ return e.toUpperCase() });
        return this;
    };

	/**
	 * when - all environments
	 * @see when
	 * @return {Config}
	 */
	Config.prototype.always = function(){
        this._whenEnvironments = false;
        return this;
    };


	/**
	 * construct a source hint for the ConfigStore
	 * Hints are stored in the config to indicate source of applied changes
	 *
	 * @param method
	 * @param source
	 * @param environment
	 * @return {string}
	 * @private
	 */
	function _keySourceHintFrom( method, source, environment ){
		var hints = [];
		if( method ) hints.push( method );
		if( source ) hints.push( source );
		if( environment ) hints.push( "WHEN " + environment );

		return hints.join(' ');
	}



	/**
	 * Set configuration from a file conditional on the environment
	 * @param configFileName
	 * @return {Config}
	 * @private
	 */
    Config.prototype.file = function( configFileName ){
        if( this._shouldApplyConfig() ){
			this._loadAndApplyConfigFile( configFileName );
        }
        this._whenEnvironments = false;
        return this;
    };

	/**
	 * Set configuration by evaluating a function conditional on the when clause
	 * @param aFunction
	 * @return {Config}
	 */
	Config.prototype.function = function( aFunction ){
		if( !_.isFunction( aFunction )) throw new Error("input must be a function");
		if( this._shouldApplyConfig() ){
			this.object( aFunction(), "USE-FUNCTION" );
		}
		this._whenEnvironments = false;
		return this;
	};

	// ----------------------------
	// Set configuration by requiring a module and applying the object on the when clause
	// NOTE: Caller should fully resolve path else require will attempt to locate relative to THIS module
	// ----------------------------
	/**
	 * Set configuration by requiring a module and applying the object on the when clause
	 *
	 * Note: Caller should fully resolve path else require will attempt to locate relative to THIS module
	 *
	 * @param modulePath
	 * @return {Config}
	 */
	// EXPERIMENTAL - NOT READY FOR PRODUCTION. FEATURE MIGHT NOT BE INCLUDED IN FUTURE RELEASES
	Config.prototype.require = function( modulePath ){
		if( modulePath !== path.resolve( modulePath )){
			console.log("Config: Warning: require parameter should be resolved. @see path.resolve" );
		}
		if( this._shouldApplyConfig() ){
			this.object( require( modulePath ), "USE-REQUIRE" );
		}
		this._whenEnvironments = false;
		return this;
	};

	/**
	 * Set configuration from an OS environment variable
	 * @param key
	 * @param envVariableName
	 * @return {Config}
	 */
    Config.prototype.env = function( key, envVariableName ){
	    if( process.env[ envVariableName ] !== undefined && this._shouldApplyConfig() ){
            this._configStore.set( key, process.env[ envVariableName ], _keySourceHintFrom( 'USE-ENVIRONMENT', envVariableName, this._whenEnvironments) );
        }
        this._whenEnvironments = false;
        return this;
    };

	/**
	 * Set configuration from the command line arguments and cli flags
	 * @param alternativeCommandlineArguments
	 * @return {Config}
	 */
	Config.prototype.cliParse = function( alternativeCommandlineArguments ){
		var self = this;
		var interpreterOptions = {};

		if( alternativeCommandlineArguments ){
			interpreterOptions.arguments = alternativeCommandlineArguments;
		}

		self._cliAddHelpFlagsIfNeeded();
		self._interpreter = new argv.Interpreter( self._cliFlags, interpreterOptions );

		if( self._cliArgumentsPath ){
			self._configStore.set( self._cliArgumentsPath, self._interpreter.arguments, _keySourceHintFrom( 'USE-COMMAND-LINE' ), self._whenEnvironments );
		}

		_.each( this._cliFlags, function( flagSpec ){
			var sourceHint = 'USE-COMMAND-LINE';
			var value = self._interpreter.values[ flagSpec.path ];
			if( value === undefined && flagSpec.defaultValue !== undefined ){
				sourceHint += '(DEFAULT)';
				value = flagSpec.defaultValue;
			}
			self._cliApplyCommandlineValue( flagSpec.path, value, flagSpec.flags, flagSpec.parser, _keySourceHintFrom( sourceHint, flagSpec.flags, self._whenEnvironments) );
		});

		if( this._cliStdinFlagSpec && _.size( this._cliStdinBufferData ) > 0 ){
			this._cliApplyCommandlineValue( this._cliStdinFlagSpec.path, this._cliStdinBufferData, this._cliStdinFlagSpec.flags, this._cliStdinFlagSpec.parser,  _keySourceHintFrom( 'USE-COMMAND-LINE (STDIN)', this._whenEnvironments ));
		}

		this._whenEnvironments = false;

		if( self._interpreter.values[ CLI_FLAG_HELP_PATH ]){
			this.cliPerformHelp();
		}

		return this;
    };

	Config.prototype._cliApplyCommandlineValue = function( path, value, flags, parser, sourceHint ){
		if( value !== undefined ){
			if( parser && typeof parser === 'function'){
				try{
					value = parser.call( null, value );
				}catch( error ){
					console.error( "Error parsing input for option: ", flags );
					value = undefined;
				}
			}
			this._configStore.set( path, value, sourceHint );
		}
	};

	Config.prototype._cliAddHelpFlagsIfNeeded = function(){
		var helpFlags = [];
		var allFlags = _.flatten( _.map( this._cliFlags, 'flags'));
		if( !_.includes( allFlags, 'h' )) helpFlags.push('h');
		if( !_.includes( allFlags, 'help')) helpFlags.push('help');
		if( helpFlags.length > 0 ){
			this.cliFlag( CLI_FLAG_HELP_PATH, helpFlags, 'Show command help' );
		}
	};

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

	/**
	 * Either calls the user's onHelp callback or displays the help text and process.exit's
	 * @return {*}
	 */
	Config.prototype.cliPerformHelp = function(){
    	var helpMessage = this.cliHelpMessage();
    	if( this._onHelpCallback ) return this._onHelpCallback( helpMessage );

    	// Default help behavior
    	console.log( helpMessage );
    	process.exit(0);
	};

	/**
	 * Set the usage message
	 * @param message
	 * @return {Config}
	 */
	Config.prototype.cliUsage = function( message ){
    	if( !_.isString( message )) throw new Error( "CONFIG: cli usage requires a message string as input" );
    	this._cliUsageMessage = "Usage: " + path.basename( process.argv[1] ) + " " + message;
    	return this;
	};

	/**
	 * Set the onHelp callback
	 * @param aFunction( string )
	 * @return {Config}
	 */
	Config.prototype.cliOnHelp = function( aFunction ){
		if( !_.isFunction( aFunction )) throw new Error( "CONFIG: cliOnHelp requires a function as input" );
		this._onHelpCallback = aFunction;
		return this;
	};

	/**
	 * Build a flagSpec from the input parameters
	 *
	 * @param path: String
	 * @param flags: String or array of strings specifying command line flags
	 * @param description: optional, String
	 * @param optionalDefaultValue
	 * @param optionalParser, (value) function(value)
	 * @return {Object}
	 */
	Config.prototype._buildCliFlagSpec = function( path, flags, description, optionalDefaultValue, optionalParser ){
		if( path === undefined || flags === undefined ) throw new Error( "CONFIG: cli option requires path and flags parameters" );
		if( _.isArray( flags ) ) flags = flags.join( ',' );

		if( typeof optionalDefaultValue === 'function' && arguments.length === 4 ){
			optionalParser = optionalDefaultValue;
			optionalDefaultValue = undefined;
		}

		var flagsData = _parseFlagsParameter( flags );
		var flagsString = _flagsAsSantizedString( flagsData );

		return {
			path: path,
			flags: flagsData.flags,
			flagsString: flagsString,
			parameter: flagsData.parameter,
			description: description,
			defaultValue: optionalDefaultValue,
			parser: optionalParser
		};
	};

	/**
	 *
	 * @param path: String
	 * @param flags: String or array of strings specifying command line flags
	 * @param description: optional, String
	 * @param optionalDefaultValue
	 * @param optionalParser, (value) function(value)
	 * @return {Config}
	 */
    Config.prototype.cliFlag = function( path, flags, description, optionalDefaultValue, optionalParser ){
		this._cliFlags.push( this._buildCliFlagSpec.apply( null, arguments ) );
		return this;
	};

	Config.prototype.cliStdin = function( path, flags, description, optionalDefaultValue, optionalParser ){
		if( _.size( path ) === 0 ) throw new Error( "CONFIG: cliStdin requires path" );

		var flagSpec = false;

		if( _.size(flags) ){
			// if flags is include, then user is declaring both a command line flag and stdin
			flagSpec = this._buildCliFlagSpec.apply( null, arguments );
			this._cliFlags.push( flagSpec );
		}else{
			if( typeof optionalDefaultValue === 'function' && arguments.length === 4 ){
				optionalParser = optionalDefaultValue;
				optionalDefaultValue = undefined;
			}
			flagSpec = {
				path: path,
				flags: "",
				parameter: "",
				description: description,
				defaultValue: optionalDefaultValue,
				parser: optionalParser,
			};
		}


		this._cliStdinDescription = flagSpec.description;

		var stdinBuffer = stdin.readSync();
		if( stdinBuffer !== null ){
			this._cliStdinBufferData = stdinBuffer;
			this._cliStdinFlagSpec = flagSpec;
		}
		return this;
	};


	/**
	 * Set path to store command line arguments that aren't matched to flags
	 * @param path
	 * @return {Config}
	 */
	Config.prototype.cliArguments = function( path ){
		this._cliArgumentsPath = path;
    	return this;
	};

	function _flagsAsSantizedString( flagsData ){
		var flagsAsStrings = [];
		_.each( flagsData.flags, function( flag ){
			if( flag.length === 1 ) flagsAsStrings.push( "-" + flag );
			else flagsAsStrings.push( "--" + flag );
		});
		var flagsString = flagsAsStrings.join(", ");
		if( flagsData.parameter ) flagsString += " " + flagsData.parameter;
		return flagsString;
	}

	function _formatHelpColumns( col1, col2 ){
		if( !_.isString(col1) ) col1 = "";
		if( !_.isString(col2) ) col2 = "";
		return "  " + _.padEnd( col1, 20 ) + "  " + col2;
	}

	function _flagUsageLine( cliFlagSpec ){
		var additionalInfo = [];
		if( cliFlagSpec.description !== undefined ) additionalInfo.push( cliFlagSpec.description );
		if( cliFlagSpec.defaultValue !== undefined ) additionalInfo.push( "default: '" + cliFlagSpec.defaultValue + "'" );
		return _formatHelpColumns( cliFlagSpec.flagsString, additionalInfo.join(', ')) + "\n";
	}

	Config.prototype.cliHelpMessage = function(){
		var self = this;
		var output = "";
		if( self._cliUsageMessage ) output += self._cliUsageMessage + "\n\n";

		output += "Flags:\n";

		_.each( this._cliFlags, function( cliFlagSpec ){
			output += _flagUsageLine( cliFlagSpec );
		});

		if( self._cliStdinDescription ){
			output += _formatHelpColumns("<stdin>", this._cliStdinDescription );
		}

		return output;
	};

	/**
	 * Set configuration using an object
	 *
	 * @param configData
	 * @param optionalHint
	 * @return {Config}
	 */
    Config.prototype.object = function( configData, optionalHint ){
	    if( this._shouldApplyConfig() ){
            this._configStore.set( '.', configData, _keySourceHintFrom( 'USE-OBJECT', optionalHint, this._whenEnvironments) );
        }
        this._whenEnvironments = false;
        return this;
    };

	/**
	 * Log the current configuration
	 * @param options
	 * @return {Config}
	 */
    Config.prototype.list = function( options ){
        options = options || {};
        if( options.noColor === undefined ) options.noColor = this._options.noColor;
        if( options.outputStream === undefined ) options.outputStream = console.log;
	    var chalk = require('chalk');

	    chalk.enabled = ! options.noColor;

        var header = chalk.white.bold('CONFIG');
        if( this._environment ) header += ': [' + chalk.green.bold( this._environment ) + ']';
        if( this._locked ) header += ' [' + chalk.red.bold( 'LOCKED' ) + ']';
        options.outputStream( header );

        this._configStore.list( options );

        return this;
    };

	/**
	 * Set configuration using an dot-path key, eg. (tree.height, 25)
	 * @param configKeyPath
	 * @param configValue
	 * @param optionalHint
	 * @return {*}
	 * @private
	 */
    Config.prototype.set = function( configKeyPath, configValue, optionalHint ){
        if( this._locked ){
            if( this._options.exceptionOnLocked ) throw Error( 'CONFIG: Cannot modify config after locking' );
            else console.error('CONFIG: Cannot modify config after locking' );
            return false;
        }
		if( this._shouldApplyConfig() ){
			this._configStore.set( configKeyPath, configValue, _keySourceHintFrom( 'SET', optionalHint, this._whenEnvironments ) );
		}
        return this;
    };

	/**
	 * Get config with a dot-path key, e.g., get( tree.height )
	 * @param configKeyPath
	 * @param defaultValue
	 */
    Config.prototype.get = function( configKeyPath, defaultValue ){
        var value = this._configStore.get( configKeyPath, defaultValue );
        if( this._locked && this._options.cloneWhenLocked ){
            if( ! (value instanceof Function) ){        // function mutability is strange, function may have state, and this preserves state
                value = _.cloneDeep( value );
            }
        }
        return value;
    };

	/**
	 * Helper to parse a config file.
	 *
	 * If input is an array of paths, will parse the first file found
	 *
	 * File need not exist
	 *
	 * @param configFilePath or Array:configFilePaths
	 * @private
	 */
    Config.prototype._loadAndApplyConfigFile = function( configFilePath ){
        var configFileData = false;

	    var configFileNameArray = arrayWrap.wrap( configFilePath );
	    var configFileContents = fsCoalesce.readFirstFileToExistSync( configFileNameArray );

	    if( !configFileContents ) return;

        try{
            configFileData = JSON.parse( configFileContents );
            if( this._options.debug ) console.log('CONFIG: [' + _environment + '] Loaded config from file:', configFilePath );
        } catch( error ){
            if( error.code !== 'ENOENT' ){		// file doesn't exist, skip it
                console.error('CONFIG: Error reading file:', configFilePath, error );
            }
        }

        if( configFileData ){
        	this.object( configFileData, 'USE-FILE' );
        }
    };

	module.exports = _config;
})();
