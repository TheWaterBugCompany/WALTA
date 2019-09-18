require('../mocha');
require('./reporters/ti-spec');

// stub location that mocha uses
global.location = {};


Mocha.prototype.loadFiles = function(fn) {
	var self = this;
	var suite = this.suite;
	this.files.forEach(function(file) {
	  suite.emit('pre-require', global, file, self);
	  suite.emit('require', require(file), file, self);
	  suite.emit('post-require', global, file, self);
	});
	fn && fn();
  };

// set the ti-spec reporter by default
Ti.API.debug("Starting ti-mocha...");

Ti.App.addEventListener( "uncaughtException", function(e) {
	try {
		mocha.throwError( e );
	} catch(err) {

	}
});
exports = module.exports = Mocha;