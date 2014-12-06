( function() {

    function _map(){
        if( _commandMap ) return _commandMap;

        _commandMap = _makeMapFromArgs( process.argv );
        return _commandMap;
    }

    function _makeMapFromArgs( argv ){

        if( argv.length < 2 ) return {};

        var map = { 'default' : true };
        var currentArgumentName = 'default';

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

    function Processor( hints ){
        this.commandMap = {};
        this.hints = hints;
        this.map = _makeMapFromArgs( process.argv );
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