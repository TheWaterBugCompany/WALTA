/* Use this function to run a specified test (useful for debugging) */
/*if ( typeof( RUN_MANUAL_TEST ) === 'undefined' ) {
	RUN_MANUAL_TEST = true;
	function _WALTA_runTest( name, bManual ) {
		RUN_MANUAL_TEST = bManual;
		Ti.include('/lib/jasmine.js');
		Ti.include("/spec/" + name + "_spec.js");
		jasmine.getEnv().execute();
	};
}*/
Ti.include('lib/jasmine');
Ti.include('/spec/AnchorBar_spec.js');
jasmine.getEnv().execute();
