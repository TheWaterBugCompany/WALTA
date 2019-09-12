require('../mocha');
require('./reporters/ti-spec');

// stub location that mocha uses
global.location = {};

exports = module.exports = mocha;

// reset the suites each time mocha is run
var _mochaRun = mocha.run;
mocha.run = function(fn) {
	return _mochaRun.call(this, function() {
		mocha.suite.suites.length = 0;
		if (fn) { fn.apply(this, arguments); }
	});
};

// set the ti-spec reporter by default
Ti.API.debug("Starting ti-mocha...");

Ti.App.addEventListener( "uncaughtException", function(e) {
	try {
		mocha.throwError( e );
	} catch(err) {

	}
});

mocha.setup({
	ui: 'bdd',
	reporter: 'ti-spec'
});
