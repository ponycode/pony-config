// ------------------------------------------------------
// Environment search
//
// (c) 2014 PonyCode Corporation
// License to distribute freely
//
// Determines the environment in which the application is running
//
// Options are used in the following order...
//
// options.env is a system environment variable to be used
//
// options.paths is a path string or an array of path strings
// 		where the file contains an environment name as a string (eg, prod).
//		The first file located and read will be used.
//
// options.default is an env value to be used if no other found
//		e.g., 'local' or 'dev'
//
// options.debug turns on debug logging
//
// returns a string from the first source located, or false
//
// ------------------------------------------------------

( function(){

    // --------------------------
    // External Dependencies
    // --------------------------
	var fs = require('fs');
    var arrayWrap = require('./array-wrap');
	var fsCoalesce = require('fs-coalesce');

	function _search( options ){
		options = options || {};
        var debug = options.debug;

        // ------------------------------
        //  Use environment variable if found
        // ------------------------------
        if( options.env ){
            if( debug ) console.log( 'env.sh: looking for env variable: ', options.env );
            var envFromEnvVar = process.env[ options.env];
            if( envFromEnvVar ){
                if( debug ) console.log( 'env.sh: loaded environment from env variable: ', options.env, '=', envFromEnvVar );
                return envFromEnvVar;
            }
        }

        // ------------------------------
		// Use Search Paths to load env file if found
		// ------------------------------
		if( options.paths ) {
			options.paths = arrayWrap.wrap( options.paths );
			var envFromFile = fsCoalesce.readFirstFileToExistSync( options.paths );
            if (envFromFile !== false) {
	            envFromFile = envFromFile.trim();
                if( debug ) console.log( 'env.sh: loaded environment from file:', envFromFile );
                return envFromFile;
            }
        }

		// ------------------------------
		// Use default value if given
		// ------------------------------
        var defaultEnvironment = options['default'];
		if( defaultEnvironment ){
            if( debug ) console.log( 'env.sh: using default environment:', defaultEnvironment );
			return defaultEnvironment;
		}

        // ------------------------------
        // FINALLY return false if nothing found
        // ------------------------------
        if( debug ) console.log( 'env.sh: no environment found' );
		return false;
	}
	
    // -----------------------------
    // Public Functions
    // -----------------------------
	exports.search = _search;

})();