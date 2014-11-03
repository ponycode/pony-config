// ------------------------------------------------------
// Config loader
// (c) 2014 PonyCode Corporation
// License to distribute freely
//
// TODO
// use config.when( env ).useFile()
// lowercase all keys
// add debug mode to trace key overwrites
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

    // ----------------------------
    // Configuration State, Module-Global by design
    // ----------------------------
    var _configData = false;
    var _options = {};
    var _environment = false;


    // ----------------------------
    // Each application of config data overwrites previous values for that key
    // ----------------------------
    function _applyConfigData( configData ){
        _configData = _.extend( {}, _configData, configData );
    }

    // ----------------------------
    // Options:
    //  debug - logs configuration changes
    // ----------------------------
    function _setOptions( options ){
        _options = options || {};
    }

    // ----------------------------
    // Environment Switching:
    // Ignores config settings that aren't for the current environment
    // ----------------------------

    function _environmentSearch( search ){
        _environment = env.search( search );
    }

    function _useEnvironment( environment ){
        _environment = environment;
        return this;
    }

    function _getEnvironment(){
        return _environment;
    }

    function _shouldApplyConfig( environments ){

        if( environments === undefined ) return true;

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
    // Set configuration from a file
    // ----------------------------
    function _useFile( configFileName, environments ){
        if( _environment === false ){
            throw { 'message': 'Must set environment before loading config data', 'name' : 'CONFIG Misuse' };
        }

        if( _shouldApplyConfig( environments ) ){
            _loadAndApplyConfigFile( configFileName );
        }

    }

    // ----------------------------
    // Set configuration from an OS environment variable
    // ----------------------------
    function _useEnvironmentVar( key, envVariableName, environments ){
        if( _environment === false ){
            throw { 'message': 'Must set environment before applying environment variables', 'name' : 'CONFIG Misuse' };
        }

        if( _shouldApplyConfig( environments ) && process.env[ envVariableName ] !== undefined ){
            _set( key, process.env[ envVariableName ] );
        }
    }

    // ----------------------------
    // Set configuration using an object
    // ----------------------------
    function _useObject( configData, environments ){
        if( _environment === false ){
            throw { 'message': 'Must set environment before applying environment variables', 'name' : 'CONFIG Misuse' };
        }

        if( _shouldApplyConfig( environments ) ){
            _applyConfigData( configData );
        }
    }

    // ----------------------------
    // Set configuration using an dot-path key, eg. (tree.height, 25)
    // ----------------------------
    function _set( configKey, configValue ){
        if( configKey.indexOf('.') > 0 ){
            _setValueForDottedKeyPath( _configData, configValue, configKey.split('.') );
        }else{
            _configData[ configKey ] = configValue;
        }
    }

    // ----------------------------
    // Get config with a dot-path key, e.g., get( tree.height )
    // ----------------------------
    function _get( configKey, defaultValue ){
        if( !_.isString(configKey) ) return defaultValue;
        if( _configData === false ) return defaultValue;

        var configValue = false;
        if( configKey.indexOf('.') > 0 ){
            // Dotted path 'setting.setting.value' - dig into config to get the leaf value
            configValue = _getValueForDottedKeyPath( _configData, configKey.split('.') );
        }else{
            configValue = _configData[ configKey ];
        }

        return ( configValue === undefined ) ?  defaultValue : configValue;
    }

    // ----------------------------
    // Log the current configuration
    // ----------------------------
    function _list(){

        var keys = _.keys( _configData );
        console.log('------------------------------------');
        console.log( 'CONFIG: [' + _environment + ']' );
        for( var i = 0; i < keys.length; i++ ){
            var key = keys[i];
            console.log( '\t' + key + ': ' + require('util').inspect(_configData[key], true, 10) );
        }
        console.log('------------------------------------');

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
            if( error.code !== 'ENOENT' ){		// file doesn't exist, start a new one
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
                throw new Error("Attempt to get value with path through non object at path: " + configKeyPathComponents );
            }
            return _getValueForDottedKeyPath( sourceData[nextComponent], configKeyPathComponents );
        }
    }

    // ----------------------------
    // Expose public functions
    // ----------------------------
    exports.setOptions = _setOptions;
    exports.environmentSearch = _environmentSearch;
    exports.getEnvironment = _getEnvironment;
    exports.useEnvironment = _useEnvironment;
    exports.useFile = _useFile;
    exports.useObject = _useObject;
    exports.useEnvironmentVar = _useEnvironmentVar;
    exports.get = _get;
    exports.set = _set;
    exports.list = _list;

})();
