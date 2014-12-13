// ------------------------------------------------------
// Object Merge
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

    exports.merge = _merge;
})();