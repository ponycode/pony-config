( function() {

    var _ = require('underscore');
    var parseArgs = require('minimist');

    // ---------------------------
    // Public Interface is this constructor and its methods
    // ---------------------------

    function Interpreter( usage ){

        this.pathMap = _importUsageRules( usage );
        this.args = parseArgs( process.argv.slice(2), {} );
        this.valueMap = _mapArgValuesToPaths( this.args, this.pathMap );

        function _importUsageRules( usageRules ){
            var usage = {};

            if( _.isArray( usageRules )){
                for( var i=0; i < usageRules.length; i++ ){
                    var usageRule = usageRules[i];
                    _importUsageRule( usage, usageRule );
                }
            } else if( _.isObject( usageRules )){
                _importUsageRule( usage, usageRules );
            }

            return usage;
        }

        function _importUsageRule( usage, usageRule ){
            if(_.isArray( usageRule.options )){
                for( var i=0; i < usageRule.options.length; i++ ){
                    var option = usageRule.options[i];
                    usage[ option ] = usageRule.path;
                }
            } else {
                var option = usageRule.options;
                usage[ option ] = usageRule.path;;
            }
        }

        function _mapArgValuesToPaths( args, paths ){

            var valueMap = {};
            _.each( args, function( value, arg ){
                var path = paths[ arg ];
                if( path ){
                    valueMap[ path ] = value;
                }
            });

            return valueMap;
        }

    }

    exports.Interpreter = Interpreter;

})();