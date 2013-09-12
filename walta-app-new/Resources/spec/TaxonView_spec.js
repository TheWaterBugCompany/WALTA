var _ = require('lib/underscore')._;
var meld = require('lib/meld');

var TaxonView = require('ui/TaxonView');
var Taxon = require('logic/Taxon');
var TestUtils = require('util/TestUtils');

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
		var openCalled = false;		
		runs(function() {		
			win.addEventListener( 'open', function(e) { openCalled = true; } );
			win.open();
		});
		
		waitsFor(function() {
			return openCalled;
		}, "Window to open", 750 );
		
		runs(function() {
			expect( openCalled, true );
		});
	});
	
	it('should fire the onBack event when the back button is clicked', function() {
		var evtFires = false;	
		runs(function() {	
			meld.on( tv, "onBack", function(uri) { evtFires = true; } );
			tv._views.goBack._views.btn.fireEvent('click');
		});
		
		waitsFor(function() {
			return evtFires;
		}, "onBack to be called", 750 );
		
		runs(function() {
			expect( evtFires, true );
		});
		
	});
	
	it('the description text should be visible', function() {
		
		runs(function() {
			expect( tv._views.details.rect.height ).toBeGreaterThan( 0 );
		});
		
	});
	
	runs(function() {
		if ( ! TestUtils.isManualTests() ) {
			win.close();
		}
	});
	



	
});


