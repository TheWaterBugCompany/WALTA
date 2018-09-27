require('../mocha');
var util = require('./util');
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

// Override the console functions with node.js-style formatting. This allows us to use some of mocha's existing
// reporters with only a few modifications, like I do with spec.
var types = ['info','log','error','warn','trace'];

// Use node.js-style util.format() for each console function call
function createConsoleLogger(type) {
	console[type] = function(...args) {
		Ti.API.log(type === 'log' ? 'info' : type, util.format.apply(this, args));
	};
}

for (var i = 0; i < types.length; i++) {
	createConsoleLogger(types[i]);
}


// set the ti-spec reporter by default
Ti.API.info("Starting ti-mocha...");
mocha.setup({
	ui: 'bdd',
	reporter: 'ti-spec'
});
