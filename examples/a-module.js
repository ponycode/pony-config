( function(){

	const importantValue = Math.exp( Math.cos( Math.PI / 4 ));

	module.exports = {
		zipCode: 29424,
		servers: [
			'https://thisone.gov',
			'https://thatone.edu',
			'https://anotherone.com'
		],
		multiplier: importantValue,
		divider:  1 / importantValue
	};

})();