// ------------------------------------------------------
// Object Tools
//
// (c) 2014 PonyCode Corporation
// License to distribute freely
//
// Simple native object merge
//
// { a : { b : "value", c : "value" }} MERGE { a : { b : "replace", e : "new" }}
//   - YIELDS -
// { a : { b : "replace", c : "value", e: "new" }}
//
// Primitive properties will be replace object properties
// Object properties will be merged with object properties at the same key
//
// ------------------------------------------------------

( function( undefined ) {

	var arrayWrap = require('./array-wrap');
    var _ = require("lodash");
    
    function ConfigStore( options ){
        this._trace = {};
        this._data = {};
	    this._options = options || {};

        if( this._options.maxListValueLength === undefined ) this._options.maxListValueLength = 60;
        if( this._options.maxListDepth === undefined ) this._options.maxListDepth = 8;
    }

    ConfigStore.prototype.lock = function(){
        function _freezeObject( object ){
            if( object instanceof Buffer || object instanceof Function ) return; // Cannot freeze these

            if( !Object.isFrozen(object) ) Object.freeze( object );
            
            _.forOwn( object, function( value, key ){
                if( _.isObject( value ) ){
                    _freezeObject( value );
                }else if( _.isArray( value ) ){
                    _.each( value, function( val ){
                        _freezeObject( value );
                    });
                }
            });
        }
        _freezeObject( this._data );
    };
    
    ConfigStore.prototype.set = function( keyPath, value, traceSource ){
        if( !keyPath || !keyPath.length ) return;

        traceSource = traceSource || "?";
        if( keyPath === '.' ){
            this._data = this._merge( this._data, value, traceSource, "" );
        } else if( keyPath.indexOf('.') > 0 ){
            this._setValueForDottedKeyPath( this._data, value, keyPath.split('.'), traceSource, keyPath );
        }else{
            this._data[ keyPath ] = this._merge( this._data[ keyPath ], value, traceSource, keyPath );
        }
    };

    ConfigStore.prototype.get = function( keyPath, defaultValue ){
        if( !keyPath || !keyPath.length ) return undefined;

        var value;

        if( keyPath === '.' ){
            value = this._data;
        } else if( keyPath.indexOf('.') != -1 ){
            value = this._getValueForDottedKeyPath( this._data, keyPath.split('.') );
        }else{
            value = this._data[ keyPath ];
        }
        return ( value === undefined ) ? defaultValue : value ;
    };

    ConfigStore.prototype.list = function( options ){
        var self = this;
		var chalk = require('chalk');

        options = options || {};
        if( options.maxListDepth === undefined ) options.maxListDepth = self._options.maxListDepth;
        if( options.maxListValueLength === undefined ) options.maxListValueLenth = self._options.maxListValueLength;
        if( options.maxListDepth === 0 ) return;
		if( options.secure ) options.secure = arrayWrap.wrap( options.secure );

        var outStream = options.outputStream || console.log;

        var valueFormatter = ( options.formatter ) ? options.formatter : function(v){ return v; };

        var dStr = '├───';
        var depthString = '';
        for( var i=0; i <= options.maxListDepth; i++) depthString += dStr;

	    function _isPrintableObject( object ){
		    if (object instanceof Function)  return true;
		    if (object instanceof String)    return true;
		    if (object instanceof Number)    return true;
		    if (object instanceof Date)      return true;
		    if (object instanceof RegExp)    return true;
		    if (object instanceof Buffer)    return true;
		    return false;
	    }

        function _valueSecured( keyPath ){
            if( !options.secure ) return false;
            if( keyPath.indexOf('.') === 0 ) keyPath = keyPath.slice(1);
            for( var i=0; i < options.secure.length; i++ ){
                var secureProperty = options.secure[i];
                if( secureProperty instanceof RegExp ){
                    if( keyPath.match( secureProperty ) !== null ) return true;
                }else{
                    if( keyPath === secureProperty) return true;
                }
            }
			return false;
        }
	    
	    function _recursiveListObject( object, path, depth ){
            path = path || "";
            depth = depth || 1; // the first set of config is at depth 1

		    var depthIndicator = depthString.substring(0,dStr.length*(depth));
            for( var key in object ){
                if( object.hasOwnProperty( key ) ){

                    var line = chalk.white( depthIndicator );

	                line += chalk.white.bold( key ) + chalk.white(' : ');
	                
	                var value = object[key];
					var fullKeyPath = path + "." + key;
	                var stringValue = false;
                    var stringValueTruncated = false;
                    var valueSecured = false;
                    var shouldRecurse = false;
                    var source = self.trace( fullKeyPath );

                    if( value === undefined ){
                        stringValue = 'undefined';
                    } else {
                        if( _valueSecured( fullKeyPath )){
                            shouldRecurse = false;
                            valueSecured = true;
                        } else {
                            if (value instanceof Object) {
                                if (_isPrintableObject(value)) {
                                    stringValue = valueFormatter( value, fullKeyPath ).toString();
                                } else {
                                    if (depth <= options.maxListDepth - 1){
                                        shouldRecurse = true;
                                    } else {
                                        stringValue = chalk.yellow( '...' );
                                    }
                                }
                            } else {
                                stringValue = valueFormatter( value, fullKeyPath ).toString();
                            }

                        }
                    }

                    if( stringValue && stringValue.length > options.maxListValueLength ){
                        stringValue = stringValue.substring( 0, options.maxListValueLength );
                        stringValueTruncated = true;
                    }

                    if( valueSecured ){
                        line += chalk.red( "*****" );
                    } else {
                        if( stringValue ) line += chalk.cyan( stringValue );
                        if( stringValueTruncated ) line += chalk.yellow(' ...');
                    }
                    if( source ) line += ' [' + chalk.yellow( source ) + ']';


                    outStream( line );

                    if( shouldRecurse ){
                        _recursiveListObject( value, fullKeyPath, depth+1);
                    }
                }
            }
        }

        _recursiveListObject( self._data );
    };

    ConfigStore.prototype.trace = function( key ){
        if( key === undefined ) return this._trace;
        return this._trace[ this._normalizedKey( key ) ];
    };

    ConfigStore.prototype._normalizedKey  = function( key ){
        return (key.charAt(0) !== '.' ) ? "." + key : key;
    };


    // ----------------------------
    // Helper to merge two values (objects or primitives)
    // ----------------------------
    ConfigStore.prototype._merge = function( backObject, frontObject, sourceName, currentPath ){

        currentPath = currentPath || "";
        sourceName = sourceName || "?";
        this._trace[ this._normalizedKey(currentPath) ] = sourceName;

        if( backObject === undefined ) {
            return frontObject;
        }


        if( Array.isArray( frontObject ) || (frontObject instanceof Buffer) || !(frontObject instanceof Object) ){       // primitive value returned as-is, array used without merging
            return frontObject;
        }

        if( !(backObject instanceof Object) ){       // primitive values replaced
            return frontObject;
        }

        var outObject = {};
        var propertyName;

        // Clone one level of backObject properties
        for( propertyName in backObject ) {
            if (backObject.hasOwnProperty(propertyName)) {
                outObject[propertyName] = backObject[propertyName];
            }
        }

        // Merge in each property of front object, Recursive
        for( propertyName in frontObject ) {
            if (frontObject.hasOwnProperty(propertyName)) {
                outObject[ propertyName ] = this._merge( backObject[ propertyName], frontObject[ propertyName ], sourceName, currentPath + "." + propertyName);
            }
        }

        return outObject;
    };

    // ----------------------------
    // Helper to set config with a dot-path key
    // ----------------------------
    ConfigStore.prototype._setValueForDottedKeyPath = function( targetData, configValue, configKeyPathComponents, sourceName, keyPath ){
        if( configKeyPathComponents.length === 1){
            targetData[ configKeyPathComponents ] = this._merge( targetData[ configKeyPathComponents ], configValue, sourceName, keyPath );
        } else {
            var nextComponent = configKeyPathComponents.shift();
            if( typeof targetData[nextComponent] === 'undefined' ){
                targetData[nextComponent] = {};
            } else if( typeof targetData[nextComponent] !== 'object' ){
                throw new Error("Attempt to set value with path through non object at path: " + configKeyPathComponents );
            }

            this._setValueForDottedKeyPath( targetData[nextComponent], configValue, configKeyPathComponents, sourceName, keyPath );
        }
    };

    // ----------------------------
    // Helper to get config with a dot-path key
    // ----------------------------
    ConfigStore.prototype._getValueForDottedKeyPath = function( sourceData, configKeyPathComponents ){
        if( configKeyPathComponents.length === 1 ){
            return sourceData[configKeyPathComponents[0]];
        }else{
            var nextComponent = configKeyPathComponents.shift();

            if( typeof sourceData[nextComponent] === 'undefined' ) return undefined;

            if( typeof sourceData[nextComponent] !== 'object' ){
                throw new Error("Attempt to get value with path through non object at sub-path: " + configKeyPathComponents );
            }
            return this._getValueForDottedKeyPath( sourceData[nextComponent], configKeyPathComponents );
        }
    };

    // ----------------------------
    // Expose merge objects, as a utility and for testing
    // ----------------------------
    ConfigStore.prototype.mergeObjects = function( backObject, frontObject ){
        return this._merge( backObject, frontObject );
    };

    module.exports = ConfigStore;

})();