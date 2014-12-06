//var config = require('../index.js');


var argv = require('../lib/argv');

var usage = [
    { path : 'server.port', options : ['p', 'port'] },
    { path : 'canSendMail', options : ['m', 'mail'] },
    { path : 'verified', options : 'V' }
];

var interpreter = new argv.Interpreter( usage );

console.log('server.port', interpreter.valueMap['server.port'] );
console.log('canSendMail', interpreter.valueMap['canSendMail'] );
console.log('verified', interpreter.valueMap['verified'] );
