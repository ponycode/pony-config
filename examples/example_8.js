( function(){

	var config = require("../index");

	config.findRuntimeEnvironment({ env: "NOT_REALLY_HERE"})
	.when('dev').object({ winner: 'me' })
	.list();

})();