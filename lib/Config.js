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

    function Config(){
        this._data = {};
    }

    Config.prototype.set = function( keyPath, value ){
        if( keyPath === '.' ){
            this._data = _merge( this._data, value );
        } else if( keyPath.indexOf('.') > 0 ){
            _setValueForDottedKeyPath( this._data, value, keyPath.split('.') );
        }else{
            this._data[ keyPath ] = _merge( this._data[ keyPath ], value );
        }
    };

    Config.prototype.get = function( keyPath, defaultValue ){
        var value;
        if( keyPath.indexOf('.') > 0 ){
            value = _getValueForDottedKeyPath( this._data, keyPath.split('.') );
        }else{
            value = this._data[ keyPath ];
        }
        return ( value === undefined ) ? defaultValue : value ;
    };

    Config.prototype.list = function(){
        for( var key in this._data ){
            if( this._data.hasOwnProperty( key )){
                console.log('\t' + key + ': ' + require('util').inspect(this._data[key], true, 10));
            }
        }
    };

    Config.prototype.mergeObjects = function( backObject, frontObject ){
        return _merge( backObject, frontObject );
    };

    function _merge( backObject, frontObject ){
        if( frontObject === undefined ) return backObject;       // nothing to do
        if( backObject === undefined ) return frontObject;       // trivial case

        if( !(frontObject instanceof Object) ){       // primitive value returned as-is
            return frontObject;
        }

        if( !(backObject instanceof Object) ){       // primitive value returned as-is
            return frontObject;
        }

        var outObject = {};

        // Clone one level of backObject
        for( var propertyName in backObject ) {
            if (backObject.hasOwnProperty(propertyName)) {
                outObject[propertyName] = backObject[propertyName];
            }
        }

        // Merge in each property of front object
        for( var propertyName in frontObject ) {
            if (frontObject.hasOwnProperty(propertyName)) {
                var propertyValue = frontObject[propertyName];
                outObject[ propertyName ] = _merge( backObject[ propertyName], frontObject[ propertyName ] );
            }
        }

        return outObject;
    }

    // ----------------------------
    // Helper to set config with a dot-path key
    // ----------------------------
    function _setValueForDottedKeyPath( targetData, configValue, configKeyPathComponents ){
        if( configKeyPathComponents.length === 1){
            targetData[ configKeyPathComponents ] = _merge( targetData[ configKeyPathComponents ], configValue );
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

    module.exports = Config;

})();