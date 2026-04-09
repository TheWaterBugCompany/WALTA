require("spec/lib/ti-mocha");
var { expect } = require("spec/lib/chai");
var Topics = require("ui/Topics");
var { closeWindow, windowOpenTest, wrapViewInWindow, setManualTests } = require("spec/util/TestUtils");
describe("NavButton controller", function() {
  var acb, win;
	before( function(done) {
    acb = Alloy.createController( "AnchorBar", { title: "Anchor Bar"} );
    var vw = acb.getView();
    vw.bottom = 0;
    vw.height = "10%";
    win = wrapViewInWindow( vw );


    var btn = Alloy.createController("NavButton");
    btn.setLabel( "Left" );
    btn.setTopic( Topics.HABITAT );
    btn.setIconLeft( "/images/icon-go-back.png" );
    acb.addTool( btn.getView() ); 

    btn = Alloy.createController("NavButton");
    btn.setLabel( "Right" );
    btn.setTopic( Topics.BACK );
    btn.setIconRight( "/images/icon-go-forward.png" );
    acb.addTool( btn.getView() ); 

    windowOpenTest( win, done );
	});

 	after( function(done) {
		closeWindow( win, done );
  });
  
	it('should display the correct left label', function() {
    expect( acb.rightTools.children[0].children[0].children[1].text ).to.equal("LEFT");
  });

  it('should display the correct right label', function() {
    expect( acb.rightTools.children[1].children[0].children[0].text ).to.equal("RIGHT");
  });


});