var config = require('../index.js');


var argv = require('../lib/argv');

var argProcessor = new argv.Processor();
    //[
    //    { options : ['f', 'file'], expectsValue : true },
    //    { options : 'c' },
    //    { options : ['g', 'globe'], expectsValue: true }
    //]);

config.useCommandLineArgument( 'port', ['-p', '--port'], true );
