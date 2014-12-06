( function() {

    var _ = require('underscore');

    function _map(){
        if( _commandMap ) return _commandMap;

        _commandMap = _makeMapFromArgs( process.argv );
        return _commandMap;
    }

    function _makeMapFromArgs( argv, hints ){

        if( argv.length < 2 ) return {};

        var map = { '_files' : true };
        var currentArgumentName = '_files';

        var args = process.argv;
        args.shift();
        args.shift();

        for( var i=0; i < args.length; i++ ){
            var arg = args[i];

            var dashDashCommandMatch = arg.match(/(?:^--)(.*)/);    // look for --argument
            var dashCommandMatch = arg.match(/(?:^-)(.*)/);         // look for -a

            if( dashDashCommandMatch ){                             // start --argument

                currentArgumentName = dashDashCommandMatch[1];
                map[currentArgumentName] = true;

            } else if( dashCommandMatch ){                          // start -a, look for -abcd

                var commandString = dashCommandMatch[1];
                for( var j=0; j < commandString.length; j++){
                    currentArgumentName = commandString[j];
                    map[currentArgumentName] = true;
                }

            } else {
                if( hints && ! hints[ currentArgumentName ] ){
                    currentArgumentName = '_files';
                }
                _accumulateValue( map, currentArgumentName, arg )
            }
        }

        return map;
    }

    function _accumulateValue( map, key, value ){
        if (map[key] === true) {
            map[key] = value;                               // first value
        } else if( typeof map[key] === 'string' ){          // second value
            map[key] = Array( map[key], value );                   // promote to an array
        } else if( typeof map[key] === 'object' && map[key].length ){          // additional values, assume is an array
            map[key].push( value );
        }
    }

    function _importHints( inHints ){
        var hints = { '_files' : true };

        if( _.isArray( inHints )){
            for( var i=0; i < inHints.length; i++ ){
                var hint = inHints[i];
                _importHint( hints, hint );
            }
        } else if( _.isObject( inHints )){
            _importHint( inHints );
        }

        return hints;
    }

    function _importHint( hints, hint ){
        if(_.isArray( hint.options )){
            for( var i=0; i < hint.options.length; i++ ){
                var option = hint.options[i];
                hints[ option ] = ( hint.expectsValue ) ? true : false;
            }
        } else {
            var option = hint.options;
            hints[ option ] = ( hint.expectsValue ) ? true : false;
        }
    }

    function Processor( inHints ){
        this.hints = _importHints( inHints );
        this.map = _makeMapFromArgs( process.argv, this.hints );
    }

    Processor.prototype.value = function( arg ){
        if( typeof arg === 'string' ){
            return this.map[ arg ];
        }

        if( typeof arg === 'object' && arg.length ){
            for( var i=0; i < arg.length; i++ ){
                var argi = arg[i];
                if( this.map[ argi ] !== undefined ) return this.map[ argi ];
            }
        }

        return undefined;
    };


    exports.Processor = Processor;

})();