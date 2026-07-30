require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { wrapViewInWindow, closeWindow, windowOpenTest } = require('spec/util/TestUtils');
var Topics = require('ui/Topics');

describe('SampleEditMenu', function() {
	var mnu, win;
	before( function(done) {
		mnu = Alloy.createController("SampleEditMenu", { sampleId: 1 });
		win = wrapViewInWindow( mnu.getView() );
		windowOpenTest( win, done );
	});

	after( function(done) {
		closeWindow( win, done );
	});

	it('fires SITEDETAILS readonly=true when View is tapped', function(done) {
		function handler(e) {
			Topics.unsubscribe( Topics.SITEDETAILS, handler );
			expect( e.readonly ).to.equal( true );
			done();
		}
		Topics.subscribe( Topics.SITEDETAILS, handler );
		mnu.view.fireEvent("click");
	});

	it('fires SITEDETAILS readonly=false when Edit is tapped', function(done) {
		function handler(e) {
			Topics.unsubscribe( Topics.SITEDETAILS, handler );
			expect( e.readonly ).to.equal( false );
			done();
		}
		Topics.subscribe( Topics.SITEDETAILS, handler );
		mnu.edit.fireEvent("click");
	});
});
