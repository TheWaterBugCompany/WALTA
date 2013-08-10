var _ = require('lib/underscore')._;
var meld = require('lib/meld');

var TaxonView = require('ui/TaxonView');
var Taxon = require('logic/Taxon');

var tv = TaxonView.createTaxonView( 
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
var win = Ti.UI.createWindow( { 
	backgroundColor: 'white', 
	orientationModes: [ Ti.UI.LANDSCAPE_LEFT ] } 
);
win.add( tv.view );
win.addEventListener( 'click',  function(e) { win.close();  e.cancelBubble = true; } );

meld.on( tv, "onBack", function(uri) {
	alert( "onBack()" );
} );

function run() {
	win.open();
}

exports.run = run;
