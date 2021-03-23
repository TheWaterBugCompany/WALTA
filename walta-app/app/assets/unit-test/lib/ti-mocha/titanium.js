
process.browser = true;



var { Mocha } = require('unit-test/lib/mocha');
const {
	EVENT_FILE_PRE_REQUIRE,
	EVENT_FILE_POST_REQUIRE,
	EVENT_FILE_REQUIRE
  } = Mocha.Suite.constants;
require('./reporters/ti-spec');

// replace loadFiles with a version that doesn't rely on path.resolve
// and just uses vanilla require()
Mocha.prototype.loadFiles = function(fn) {
	var self = this;
	var suite = this.suite;
	
	this.files.forEach(function(file) {
	  suite.emit(EVENT_FILE_PRE_REQUIRE, global, file, self);
	  suite.emit(EVENT_FILE_REQUIRE, require(file), file, self);
	  suite.emit(EVENT_FILE_POST_REQUIRE, global, file, self);
	});
	fn && fn();
  };

/*Ti.App.addEventListener( "uncaughtException", function(e) {
	try {
		mocha.throwError( e );
	} catch(err) {

	}
});*/
module.exports = Mocha;