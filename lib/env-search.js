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

	module.exports = function( searchSpec ){
		searchSpec = searchSpec || {};
        var log = searchSpec.debug ? console.log : function(){};

        // ------------------------------
        //  Use environment variable if found
        // ------------------------------
        if( searchSpec.env ){
            log( 'CONFIG: looking for env variable: ', searchSpec.env );
            var envFromEnvVar = process.env[ searchSpec.env];
            if( envFromEnvVar ){
                log( 'CONFIG: loaded environment from env variable: ', searchSpec.env, '=', envFromEnvVar );
                return envFromEnvVar;
            }
        }

        // ------------------------------
		// Use Search Paths to load env file if found
		// ------------------------------
		if( searchSpec.paths ) {
			searchSpec.paths = arrayWrap.wrap( searchSpec.paths );
			var envFromFile = fsCoalesce.readFirstFileToExistSync( searchSpec.paths );
            if (envFromFile !== false) {
	            envFromFile = envFromFile.trim();
                log( 'CONFIG: loaded environment from file:', envFromFile );
                return envFromFile;
            }
        }

		// ------------------------------
		// Use default value if given
		// ------------------------------
        var defaultEnvironment = searchSpec['default'];
		if( defaultEnvironment ){
            log( 'CONFIG: using default environment:', defaultEnvironment );
			return defaultEnvironment;
		}

        // ------------------------------
        // FINALLY return false if nothing found
        // ------------------------------
        log( 'CONFIG: no environment found' );
		return false;
	};

})();