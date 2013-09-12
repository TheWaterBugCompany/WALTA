// Load WALTA or the test harness
(function() {
		var TestUtils = require('util/TestUtils');
		TestUtils.setManualTests(true);		
		Ti.include('/lib/jasmine.js');
		Ti.include('/spec/QuestionView_spec.js');
		
		var jasmineEnv = jasmine.getEnv();
		jasmineEnv.execute();	
})();
