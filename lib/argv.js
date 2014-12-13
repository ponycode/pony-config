// Pony Config Configuration Module
//
// (c) 2014 PonyCode Corporation
// License to distribute freely
//
// TODO document how using minimist has consequnces on how the command line is interpreted

( function() {

    var _ = require('underscore');
    var parseArgs = require('minimist');

    // ---------------------------
    // Public Interface is this constructor and its methods
    // ---------------------------

    function Interpreter( usage, options ){
        options = options || {};

        this.arguments = ( options.arguments ) ? options.arguments.split(' ') : process.argv.slice(2);
        this.pathMap = _importUsageRules( usage );
        this.parsedArgs = parseArgs( this.arguments, {} );
        this.values = _mapArgValuesToPaths( this.parsedArgs, this.pathMap );

        function _importUsageRules( usageRules ){
            var usage = {};

            if( _.isArray( usageRules )){
                for( var i=0; i < usageRules.length; i++ ){
                    _importUsageRule( usage, usageRules[i] );
                }
            } else if( _.isObject( usageRules )){
                _importUsageRule( usage, usageRules );
            }

            return usage;
        }

        function _importUsageRule( usage, usageRule ){
            if(_.isArray( usageRule.options )){
                for( var i=0; i < usageRule.options.length; i++ ){
                    usage[ usageRule.options[i] ] = usageRule.path;
                }
            } else {
                usage[ usageRule.options ] = usageRule.path;;
            }
        }

        function _mapArgValuesToPaths( args, paths ){

            var valueMap = {};
            _.each( args, function( value, arg ){
                if( paths[ arg ] ){
                    valueMap[ paths[ arg ] ] = value;
                }
            });

            return valueMap;
        }

    }

    exports.Interpreter = Interpreter;

})();