require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var { closeWindow, windowOpenTest, wrapViewInWindow, clickButton, checkTestResult} = require("spec/util/TestUtils");
describe("MayflyEmergenceMap controller", function() {
	var scr,view,win;
    function createMap() {
        scr = Alloy.createController("MayflyEmergenceMap", { 
          getCurrentPosition: function( callback ) {
            callback( { 
              coords: {
                accuracy: 100,
                latitude: -42.890734,
                longitude: 147.671216
              }
            });
          }
        });
        view = scr.getView();
        win = wrapViewInWindow( view );
        win.addEventListener( "close", function handler() { 
          win.removeEventListener("close", handler);
          scr.cleanUp();
        }) 
      }
	before( function() {
	});
	after( function(done) {
		closeWindow( win, done );
	});
	it('should display the MayflyEmergenceMap view', function(done) {
		createMap();
        windowOpenTest( win, done );
    });
    it('should send event for legend click'); // How to implement selecting a webview element
});