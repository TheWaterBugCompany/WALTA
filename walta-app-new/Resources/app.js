// Load WALTA or the test harness
(function() {
	if ( true ) {
		// bootstrap the tests
		var uiTest = require('ui-test/AllTests');
		uiTest.run();
	} else {
		// bootstrap the application	
	}
})();
