( function(){

    exports.wrap = function( something ){
        if( Array.isArray( something )) return something;
        return [something];
    };

})();


