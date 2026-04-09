require("spec/lib/ti-mocha");
var { expect } = require('spec/lib/chai');
var { wrapViewInWindow, setManualTests, closeWindow, windowOpenTest, waitForEvent } = require('spec/util/TestUtils');
var Topics = require('ui/Topics');

describe('MethodSelect', function() { 
	var mnu, win;
	context("no unknown bug", function() {
		before( function(done) {
			this.timeout(3000);
			mnu = Alloy.createController("MethodSelect");
			win = wrapViewInWindow( mnu.getView() );
			windowOpenTest( win, done );
		});
	
		after( function(done) {
			closeWindow( win, done );
		});
	
		it('should fire the keysearch event', function(done) {
			mnu.on("keysearch", function event() {
				mnu.off("keysearch",event);
				done();
			});
			mnu.keysearch.trigger("click");
		});
	
		it('should fire the speedbug event', function(done) {
			mnu.on("speedbug", function event() {
				mnu.off("speedbug",event);
				done();
			});
			mnu.speedbug.trigger("click");
		});
	
		it('should fire the browse event', function(done) {
			mnu.on("browselist", function event() {
				mnu.off("browselist",event);
				done();
			});
			mnu.browselist.trigger("click");
		});
	
		
	
		it('should not show unknownbug unless specified', function() {
			expect( mnu.unknownbug ).to.be.undefined;
		})
	})
	context("with unknown bug", function() {
		before( function(done) {
			this.timeout(3000);
			mnu = Alloy.createController("MethodSelect", {unknownBug: true});
			win = wrapViewInWindow( mnu.getView() );
			windowOpenTest( win, done );
		});
	
		after( function(done) {
			closeWindow( win, done );
		});

		it('should add an unknown bug', function(done) {
			mnu.on("unknownbug", function event() {
				mnu.off("unknownbug",event);
				done();
			});
			mnu.unknownbug.trigger("click");
		});
	})
	

});
