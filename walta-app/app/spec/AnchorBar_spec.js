require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { wrapViewInWindow, closeWindow, windowOpenTest, actionFiresTopicTest, setManualTests } = require('spec/util/TestUtils');
var Topics = require('ui/Topics');

describe('AnchorBar controller', function() {
	var acb, win, vw;
	function openAnchorBar(data) {
		acb = Alloy.createController( "AnchorBar", data);
		vw = acb.getView();
		vw.bottom = 0;
		vw.height = "10%";
		win = wrapViewInWindow(vw);
	}
	afterEach( async () => closeWindow( win ) );

	describe('with default Tools', function() {
		beforeEach( function(done) {
			openAnchorBar({ title: "Anchor Bar"});
			windowOpenTest( win, done );
		});

		it('should display an anchor bar', function() {
			
		});

		it('should fire the HOME event when the home button is clicked', function(done) {
			actionFiresTopicTest( acb.home, 'click', Topics.HOME, done );
		});
	})
    describe('without default tools', function() {
		beforeEach( function(done) {
			openAnchorBar({ title: "Anchor Bar", noDefaultTools: true});
			windowOpenTest( win, done );
		})
		it('should remove the default tools when noDefaultTools is true', function() {
			expect(acb.leftTools.children.length).to.equal(0) 
		});
	});

});
