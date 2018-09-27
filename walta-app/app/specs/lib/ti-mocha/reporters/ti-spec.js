// Create a titanium compatible reporter based on spec
require('../../mocha');
/**
 * Module dependencies.
 */
var Base = Mocha.reporters.Base,
	cursor = require('../util').cursor,
	color = Base.color;

Base.useColors = true;


/**
 * Expose `TiSpec`.
 */

exports = module.exports = TiSpec;

/**
 * Initialize a new `TiSpec` test reporter.
 *
 * @param {Runner} runner
 * @api public
 */

function TiSpec(runner) {
	Base.call(this, runner);

	var self = this,
		indents = 0, n = 0;

	function indent() {
		return new Array(indents).join('  ');
	}

	function log(msg) {
		console.log(msg);
	}

	runner.on('suite', function(suite){
		++indents;
		log(color('suite', indent() + suite.title));
	});

	runner.on('suite end', function(suite){
		--indents;
	});

	runner.on('pending', function(test){
		log(color('pending', indent() + '  - ' + test.title));
	});

	runner.on('pass', function(test){
		log(color('checkmark', indent() + '  +') + color('pass', ' ' + test.title + ' ')
			+ ('fast' === test.speed ? color(test.speed, '(' + test.duration + 'ms)') : '' ) );
	});

	runner.on('fail', function(test, err){
		log(color('fail', indent() + '  ' + (++n) + ') ' + test.title));
	});

	runner.on('end', self.epilogue.bind(self) );
}

/**
 * Inherit from `Base.prototype`.
 */
Ti.API.info("loading TiSPec reporter...");
TiSpec.prototype = Object.create(Base.prototype);
TiSpec.prototype.constructor = TiSpec;
Mocha.reporters['ti-spec'] = TiSpec;
