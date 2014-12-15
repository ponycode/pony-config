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

( function() {

    function Config( options ){
        this._trace = {};
        this._data = {};
    }

    Config.prototype.set = function( keyPath, value, traceSource ){
        traceSource = traceSource || "?";
        if( keyPath === '.' ){
            this._data = this._merge( this._data, value, traceSource, "" );
        } else if( keyPath.indexOf('.') > 0 ){
            this._setValueForDottedKeyPath( this._data, value, keyPath.split('.'), traceSource, keyPath );
        }else{
            this._data[ keyPath ] = this._merge( this._data[ keyPath ], value, traceSource, keyPath );
        }
    };

    Config.prototype.get = function( keyPath, defaultValue ){
        var value;
        if( keyPath.indexOf('.') > 0 ){
            value = this._getValueForDottedKeyPath( this._data, keyPath.split('.') );
        }else{
            value = this._data[ keyPath ];
        }
        return ( value === undefined ) ? defaultValue : value ;
    };

    Config.prototype.list = function(){
        var self = this;

        function _recursiveListObject( object, path, depth ){
            var depthIndicator = "|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--".substring(0,depth*3);
            path = path || "";
            depth = depth || 0;

            for( var key in object ){
                if( object.hasOwnProperty( key ) ){
                    var isObject = (object[ key ] instanceof Object);
                    var source = self.trace( path + "." + key );
                    var line = depthIndicator + key + ' : ';
                    if( !isObject) line += object[key] + ' ';
                    if( source ) line += ' [' + source + ']';
                    console.log(line);

                    if( isObject ){
                        _recursiveListObject( object[key], path + "." + key, depth+1);
                    }
                }
            }
        }

        _recursiveListObject( self._data );
    };

    Config.prototype.trace = function( key ){
        if( key === undefined ) return this._trace;
        return this._trace[ this._normalizedKey( key ) ];
    };

    Config.prototype._normalizedKey  = function( key ){
        return (key.charAt(0) !== '.' ) ? "." + key : key;
    };


    // ----------------------------
    // Helper to merge two values (objects or primitives)
    // ----------------------------
    Config.prototype._merge = function( backObject, frontObject, sourceName, currentPath ){
        if( frontObject === undefined ) {
            return backObject;
        }

        currentPath = currentPath || "";
        sourceName = sourceName || "?";
        this._trace[ this._normalizedKey(currentPath) ] = sourceName;

        if( backObject === undefined ) {
            return frontObject;
        }


        if( !(frontObject instanceof Object) ){       // primitive value returned as-is
            return frontObject;
        }

        if( !(backObject instanceof Object) ){       // object value returned as-is
            return frontObject;
        }

        var outObject = {};
        var propertyName;

        // Clone one level of backObject
        for( propertyName in backObject ) {
            if (backObject.hasOwnProperty(propertyName)) {
                outObject[propertyName] = backObject[propertyName];
            }
        }

        // Merge in each property of front object
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
    Config.prototype._setValueForDottedKeyPath = function( targetData, configValue, configKeyPathComponents, sourceName, keyPath ){
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
    Config.prototype._getValueForDottedKeyPath = function( sourceData, configKeyPathComponents ){
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
    Config.prototype.mergeObjects = function( backObject, frontObject ){
        return this._merge( backObject, frontObject );
    };

    module.exports = Config;

})();