require("spec/lib/tijasmine").infect(this);
var TestUtils = require('util/TestUtils');

var _ = require('lib/underscore')._;
var meld = require('lib/meld');

var TaxonView = require('ui/TaxonView');
var Taxon = require('logic/Taxon');


describe('TaxonView', function() {

	var tv, win;
	
	tv = TaxonView.createTaxonView( 
			Taxon.createTaxon({
				id: "testTaxon",
				name: "Family Palaemonidae, Genus Macrobrachium",
				commonName: "Freshwater prawn", 
				size: 300,
				habitat: "Crayfish in rivers (upper photo) yabbies in wetlands/pools (lower photo).",
				movement: "walking, with sudden flips when disturbed.",
				confusedWith: "Nothing, very distinctive, We have left crayfish and Yabbies grouped together because they mostly turn up as juveniles in samples and are difficult to spearate when young.",
				signalScore: 4,
				mediaUrls: [ "/spec/resources/simpleKey1/media/amphipoda_01.jpg", "/spec/resources/simpleKey1/media/amphipoda_02.jpg", "/spec/resources/simpleKey1/media/attack_caddis_01_x264.mp4" ] 
			})
		);
		
	win = TestUtils.wrapViewInWindow( tv.view );


	it('should display the taxon view', function() {
		TestUtils.windowOpenTest( win ); 
	});
	
	it('the description text should be visible', function() {
		
		runs(function() {
			expect( tv._views.details.rect.height ).toBeGreaterThan( 0 );
		});
		
	});
	
	it('the size of the text in the webview should be stable', function() {
		var oldHeight, flag, flag2;
		
		runs(function() {
			tv._views.details.addEventListener( 'postlayout', function() { flag2 = true; } );
			
			oldHeight = tv._views.details.evalJS("document.body.children[0].offsetHeight");
			
			var photoView = tv._views.photoView;
			// Open and close the gallery to make resize bug occur
			var closeHandler = meld.before( photoView, 'onGalleryWinClosed', function( win ) {
				flag = true; 
			});
			
			var openHandler = meld.before( photoView, 'onGalleryWinOpened', function( win ) { 
					win._views.close.fireEvent('click');
				} );
				
			
			
			tv._views.photoView._views.zoomIcon.fireEvent('click');
		});
		
		waitsFor(function() {
			return flag && flag2;
		}, "gallery window opened to be called", 3000 );
		
		runs(function() {
		expect( tv._views.details.evalJS("document.body.children[0].offsetHeight") ).toEqual( oldHeight );
		});
		
		
	});
	
	TestUtils.closeWindow( win );
	
});


