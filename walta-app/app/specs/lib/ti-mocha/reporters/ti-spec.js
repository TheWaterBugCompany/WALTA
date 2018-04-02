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
		//stats = this.stats,
		indents = 0,
		n = 0;

	function NL() {
		log(cursor.reset + ' ' + cursor.reset);
	}

	function upOne() {
		return cursor.previousLine + cursor.resetLine;
	}

	function indent() {
		return new Array(indents).join('  ');
	}

	function log(msg) {
		console.log(cursor.resetLine + msg);
	}

	runner.on('start', function(){
		NL();
	});

	runner.on('suite', function(suite){
		++indents;
		log(color('suite', indent() + suite.title));
	});

	runner.on('suite end', function(suite){
		--indents;
		if (1 === indents) { NL(); }
	});

	runner.on('test', function(test){
		log(color('pass', indent() + '  o ' + test.title + ': '));
	});

	runner.on('pending', function(test){
		log(color('pending', indent() + '  - ' + test.title));
	});

	runner.on('pass', function(test){
		if ('fast' === test.speed) {
			log(upOne() + color('checkmark', indent() + '  +') + color('pass', ' ' + test.title + ' '));
		} else {
			log(upOne() + color('checkmark', indent() + '  +') + color('pass', ' ' + test.title + ' ') +
				color(test.speed, '(' + test.duration + 'ms)'));
		}
	});

	runner.on('fail', function(test, err){
		log(color('fail', upOne() + indent() + '  ' + (++n) + ') ' + test.title));
	});

	runner.on('end', self.epilogue.bind(self) );
}

/**
 * Inherit from `Base.prototype`.
 */
TiSpec.prototype = Object.create(Base.prototype);
TiSpec.prototype.constructor = TiSpec;
Mocha.reporters['ti-spec'] = TiSpec;
