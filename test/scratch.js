var config = require('../index.js');

//config.useCommandLineArgument('port', { options: ['-p, --port'], argument: true });
//
//config.list();

var argv = require('../lib/argv');

var argProcessor = new argv.Processor();

console.log( argProcessor.value( ['a'] ) );