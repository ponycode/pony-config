( function() {
	"use strict";

	var fs = require('fs');
	var _ = require('lodash');

	exports.isTTY = function(){
		return process.stdin.isTTYr;
	};

	exports.open = function(){
		var fd = process.stdin.fd;

		// Linux and MacOSX require opening the stdin device
		try {
			fd = fs.openSync('/dev/stdin', 'rs');
		} catch (e) {}

		return fd;
	};

	exports.close = function(){
		try {
			fs.closeSync( fd );
		} catch (e) {}
	};

	/**
	 * Read stdin synchronously
	 *
	 * @return {*}
	 *    Buffer if stdin can be opened and read
	 *    null otherwise
	 */
	exports.readSync = function( options ){
		if( process.stdin.isTTY ) return null;

		var BUFSIZE = _.get( options, 'BUFSIZE', 16384 );

		var outputBuffer = new Buffer(0);
		var bytesRead = 0;
		var eof = false;
		var totalBytesRead = 0;
		var fd = exports.open();

		do{
			try{
				var readBuffer = new Buffer( BUFSIZE );
				bytesRead = fs.readSync( fd, readBuffer, 0, BUFSIZE, null );
				totalBytesRead += bytesRead;
				outputBuffer = Buffer.concat( [outputBuffer, readBuffer], totalBytesRead );
			}catch( e ){
				if( e.code === 'EAGAIN' ){
					// stdin couldn't be opened
					return null;
				}else if( e.code === 'EOF' ) {
					eof = true;
				}else{
					throw e;
				}
			}

		}while( bytesRead > 0 && !eof );

		exports.close();

		return outputBuffer;
	};

})();
