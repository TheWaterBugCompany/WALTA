require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var Topics = require("ui/Topics");
var { closeWindow, windowOpenTest, setManualTests, wrapViewInWindow, actionFiresTopicTest } = require("spec/util/TestUtils");
describe("GoForwardButton controller", function() {
  var acb, win, btn;
	before( function(done) {
		acb = Alloy.createController( "AnchorBar", { title: "Anchor Bar"} );
    win = wrapViewInWindow( acb.getView() );
    btn = Alloy.createController("GoForwardButton", { topic: Topics.HABITAT});
    acb.addTool( btn.getView() ); 
    win.height = "10%";
    windowOpenTest( win, done );
	});

 	after( function(done) {
		closeWindow( win, done );
  });
  
	it('should display the correct label', function() {
    expect( acb.rightTools.children[0].children[0].children[0].text ).to.equal("NEXT");
  });

  it('should fire the correct event when the button is clicked', function(done) {
    actionFiresTopicTest( acb.rightTools.children[0], 'click', Topics.HABITAT, () => done() );
  });

});