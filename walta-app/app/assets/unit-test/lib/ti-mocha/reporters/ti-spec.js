// Create a titanium compatible reporter based on spec
require('../../mocha');
var util = require('../util');
/**
 * Module dependencies.
 */
var Base = Mocha.reporters.Base,
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

	var indents = 0, n = 0;
	var failures = this.failures;
	var stats = this.stats;

	function indent() {
		return new Array(indents).join('  ');
	}

	function log() {
		if ( arguments.length > 0 ) {
			Ti.API.info(util.format.apply(null, arguments)); 
		} else {
			Ti.API.info("");
		}
	}

	function list(failures) {
		failures.forEach(function(test, num) {
		  log();
		  
		  var msg;
		  var err = test.err;
		  var message;
		  if (err.message && typeof err.message.toString === 'function') {
			message = err.message + '';
		  } else if (typeof err.inspect === 'function') {
			message = err.inspect() + '';
		  } else {
			message = '';
		  }
		  
		  msg = message;

		  if (err.uncaught) {
			msg = 'Uncaught ' + msg;
		  }
	
		  test.titlePath().forEach(function(str, index) {
			var testTitle = '';
			if ( index === 0 ) {
				testTitle +=  `  ${num+1}) `;
			} else {
				for (var i = 0; i < index+3; i++) {
					testTitle += '  ';
				  }
			}
			testTitle += str;
			testTitle += ":";
			log( color('error title', testTitle ) );
		  });
		  
		  log( color('error message', msg ) );
		});
	  };

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
			+ ('fast' !== test.speed ? color(test.speed, '(' + test.duration + 'ms)') : '' ) );
	});

	runner.on('fail', function(test, err){
		log(color('fail', indent() + '  ' + (++n) + ') ' + test.title));
	});

	runner.once('end', function(){
		var fmt;
		log();

		// passes
		fmt = color('bright pass', ' ') +
			color('green', ' %d passing') +
			color('light', ' (%s)');
		log(fmt, stats.passes || 0, stats.duration + 'ms');

		// pending
		if (stats.pending) {
			fmt = color('pending', ' ') + color('pending', ' %d pending');
			log(fmt, stats.pending);
		}

		// failures
		if (stats.failures) {
			fmt = color('fail', '  %d failing');
			log(fmt, stats.failures);
			list(failures);
		}
	} );
}

/**
 * Inherit from `Base.prototype`.
 */
Ti.API.debug("loading TiSPec reporter...");
TiSpec.prototype = Object.create(Base.prototype);
TiSpec.prototype.constructor = TiSpec;
Mocha.reporters['ti-spec'] = TiSpec;
