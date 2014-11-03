( function(){
	
	var _ = require('underscore');
	var fs = require('fs');



	//-----------------------------
	// Determines the environment in which the application is running
	// Options are used in the following order...
	//
	// options['paths'] is a path string or an array of path strings
	// 		where the file contains an environment name (eg, 'prod').
	//		The first file located and read will be used.
	//
	// options['env'] is a system environment variable to be used
	//
	// options['default'] is an env value to be used if no other found
	//		e.g., 'local' or 'dev'
	//
	// returns a string from the first source located, or false
	//------------------------------

	function _search( options  ){
		options = options || {};

		var searchPaths = false;

		//------------------------------
		// FIRST Use Search Paths to load env file if found
		//------------------------------
		if( options.paths ){
			if( _.isString( options.paths )){
				searchPaths = [ options.paths ];
			} if( _.isArray( options.paths )){
				searchPaths = options.paths;
			}
		}

		var envFromFile = _loadEnvironmentFiles( searchPaths );
		if( envFromFile !== false ){
			return envFromFile;
		}

		//------------------------------
		// SECOND Use environment variable if found
		//------------------------------
		if( options.env ){
			if( process.env[ options.env] ){
				return process.env[ options.env];
			}
		}

		//------------------------------
		// THIRD Use default value if found
		//------------------------------
		if( options['default'] ){
			return options['default'];
		}

		// FINALLY return false
		return false;
	}


	//-----------------------------
	// opens first file found on searchPath and returns its contents
	// returns false if none found
	//-----------------------------

	function _loadEnvironmentFiles( searchPaths ){
		if( !searchPaths || searchPaths.length === 0 ) return false;

		var fileData = false;

		for( var i = 0; i < searchPaths.length; i++){
			var path = searchPaths[i];

			try{
				fileData = fs.readFileSync( path, { 'encoding' : 'utf8' } );
				fileData = fileData.trim();
			} catch(e){
			}

			if( fileData !== false ) break;
		}

		return fileData;
	}

	exports.search = _search;

})();