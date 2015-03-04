// Pony Config Configuration Module
//
// (c) 2014 PonyCode Corporation
// License to distribute freely
//
// TODO document how using minimist has consequnces on how the command line is interpreted

( function() {

    var arrayWrap = require('./array-wrap');
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

            usageRules = arrayWrap.wrap( usageRules );

            for( var u=0; u < usageRules.length; u++ ){
                var usageRule = usageRules[u];

                var options = arrayWrap.wrap( usageRule.options );
                for( var i=0; i < options.length; i++ ){
                    usage[ options[i] ] = usageRule.path;
                }
            }

            return usage;
        }

        function _mapArgValuesToPaths( args, paths ){

            var valueMap = {};
            for( var arg in args ){
                if( paths[ arg ] ){
                    valueMap[ paths[ arg ] ] = args[ arg ];
                }
            }

            return valueMap;
        }

    }

    exports.Interpreter = Interpreter;

})();