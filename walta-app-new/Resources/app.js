// Load WALTA or the test harness
// To run a test:
//Ti.include('util/TestBootStrap.js');
//_WALTA_runTest('AnchorBar',true);

var AppWindow = require('AppWindow');
var app = AppWindow.createAppWindow( 'keys/walta');
app.start();
