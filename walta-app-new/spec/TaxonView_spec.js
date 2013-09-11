var _ = require('lib/underscore')._;
var meld = require('lib/meld');

var TaxonView = require('ui/TaxonView');
var Taxon = require('logic/Taxon');

describe('TaxonView', function() {
	var tv, win;
	
	beforeEach( function() {
		
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
				mediaUrls: [ "/ui-test/resources/simpleKey1/media/amphipoda_01.jpg", "/ui-test/resources/simpleKey1/media/amphipoda_02.jpg", "/ui-test/resources/simpleKey1/media/attack_caddis_01_x264.mp4" ] 
			})
		);
		win = Ti.UI.createWindow( { 
			backgroundColor: 'white', 
			orientationModes: [ Ti.UI.LANDSCAPE_LEFT ] } 
		);
		win.add( tv.view );
	});
	
	afterEach( function() {
		win.close();
	});
	
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
	
	it('should fire the onBack event when theback button is clicked', function() {
		var evtFires = false;	
		runs(function() {	
			meld.on( tv, "onBack", function(uri) { evtFires = true; } );
			win.open();
			tv._views.goBack._views.btn.fireEvent('click');
		});
		
		waitsFor(function() {
			return evtFires;
		}, "onBack to be called", 750 );
		
		runs(function() {
			expect( evtFires, true );
		});
		
	});
});