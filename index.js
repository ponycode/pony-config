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
	var path = require('path');


    // ----------------------------
    // Local dependencies
    // ----------------------------
    var envSearch = require('./lib/env-search');
    var argv = require('./lib/argv');
    var ConfigStore = require('./lib/ConfigStore');
    var arrayWrap = require('./lib/array-wrap');

	var CLI_FLAG_HELP = { path: "__cli_help", flags: ["h","help"], description: "Show usage" };

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
		if( !_.isString( environment )) throw new Error("Environment must be a string");
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
	Config.prototype.require = function( modulePath ){
		if( this._shouldApplyConfig() ){
			this.object( require( modulePath ), "USE-FUNCTION" );
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

		self._interpreter = new argv.Interpreter( self._cliFlags, interpreterOptions );

		if( self._cliArgumentsPath ){
			self._configStore.set( self._cliArgumentsPath, self._interpreter.arguments, _keySourceHintFrom( 'USE-COMMAND-LINE' ), self._whenEnvironments );
		}

		_.each( this._cliFlags, function( flagSpec ){
			var sourceHint = 'USE-COMMAND-LINE';
			var value = self._getCommandlineValue( flagSpec.path );
			if( value === undefined && flagSpec.defaultValue !== undefined ){
				sourceHint += '(DEFAULT)';
				value = flagSpec.defaultValue;
			}
			if( value !== undefined ){
				if( flagSpec.parser ){
					try{
						value = flagSpec.parser.call( null, value );
					}catch( error ){
						console.error( "Error parsing input for option: ", flagSpec.flags );
						value = undefined;
					}
				}
				self._configStore.set( flagSpec.path, value, _keySourceHintFrom( sourceHint, flagSpec.flags, self._whenEnvironments) );
			}
		});

		this._whenEnvironments = false;

		if( this._getCommandlineValue( CLI_FLAG_HELP.path ) ){
			this.cliPerformHelp();
		}

		return this;
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
    	let helpMessage = this.cliHelpMessage();
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
	 *
	 * @param path: String
	 * @param flags: String or array of strings specifying command line flags
	 * @param description: optional, String
	 * @param optionalDefaultValue
	 * @param optionalParser, (value) function(value)
	 * @return {Config}
	 */
    Config.prototype.cliFlag = function( path, flags, description, optionalDefaultValue, optionalParser ){
		if( path === undefined || flags == undefined ) throw new Error( "CONFIG: cli option requires path and flags parameters" );
		if( _.isArray( flags ) ) flags = flags.join( ',' );

		if( typeof optionalDefaultValue === 'function' && arguments.length === 4 ){
			optionalParser = optionalDefaultValue;
			optionalDefaultValue = undefined;
		}

		var flagsSpec = _parseFlagsParameter( flags );

		var cliFlag = {
			path: path,
			flags: flagsSpec.flags,
			parameter: flagsSpec.parameter,
			description: description,
			defaultValue: optionalDefaultValue,
			parser: optionalParser
		};

		this._cliFlags.push( cliFlag );
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

	function _flagsAsSantizedString( flagsArray ){
		var flagsAsStrings = [];
		_.each( flagsArray, function( flag ){
			if( flag.length === 1 ) flagsAsStrings.push( "-" + flag );
			else flagsAsStrings.push( "--" + flag );
		});
		return flagsAsStrings.join(", ");
	}

	function _flagUsageLine( cliFlagSpec ){
		var line = "";
		var flagsString = _flagsAsSantizedString( cliFlagSpec.flags );
		if( cliFlagSpec.parameter ) flagsString += " " + cliFlagSpec.parameter;

		line += "  " + _.padStart( flagsString, 40 );
		if( cliFlagSpec.description !== undefined ) line += " " + cliFlagSpec.description;
		if( cliFlagSpec.defaultValue !== undefined ) line += ", Default='" + cliFlagSpec.defaultValue + "'";
		line += "\n";
		return line;
	}

	Config.prototype.cliHelpMessage = function(){
		var self = this;
		var output = "";
		if( self._cliUsageMessage ) output += self._cliUsageMessage + "\n\n";

		output += "Flags:\n";

		_.each( this._cliFlags, function( cliFlagSpec ){
			output += _flagUsageLine( cliFlagSpec );
		});

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

	/**
	 * Fetch the value of a command line argument by config key path without applying it to the config
	 * @param configKeyPath
	 * @return {*}
	 * @private
	 */
	Config.prototype._getCommandlineValue = function( configKeyPath ){
		if( ! this._interpreter ) {
			console.warn( "CONFIG: call parseCommandlineArguments( usage ) before getCommandlineValue" );
			return undefined;
		}
		return this._interpreter.values[ configKeyPath ];
	};

	module.exports = _config;
})();
