require("spec/lib/tijasmine").infect(this);
var _ = require('lib/underscore')._;

var Key = require('logic/Key');
var Question = require('logic/Question');
var Taxon = require('logic/Taxon');
var KeyLoaderXml = require('logic/KeyLoaderXml');

describe('KeyLoaderXml', function() {
	var key;
	it('should load a key from XML', function(){
		key = KeyLoaderXml.loadKey( Ti.Filesystem.resourcesDirectory, 'spec/resources/simpleKey1' );
		expect( key ).toBeDefined();
	});
	it('should have the correct toplevel node', function(){	
		var nd = key.root;
		expect( nd.questions.length ).toEqual( 2 );
		expect( nd.questions[0].text ).toEqual( 
			"Animals strongly flattened from the sides (like dogs and cats); "
			+ "often lying on their side or moving with their side flat against "
			+ "the substrate." );
		expect( nd.questions[0].mediaUrls ).toEqual( 
			[ Ti.Filesystem.resourcesDirectory + '/spec/resources/simpleKey1/media/couplet5p1.jpg' ]
		);
		expect( nd.questions[1].text ).toEqual( 
			"Animals not flattened or flattened 'front to back' (like humans or "
			+ "cockroaches)." );
		expect( nd.questions[1].mediaUrls ).toEqual( 
			[ Ti.Filesystem.resourcesDirectory + '/spec/resources/simpleKey1/media/couplet5p2.jpg' ]
		);
		
	});
	it('should have the correct outcome for question root[0]', function(){
		var nd = key.root.questions[0].outcome;
		expect( nd.questions.length ).toEqual( 2 );
		expect( nd.questions[0].text ).toEqual( 
			"Animal rests on its side, swims in swift bursts (below left)." );
		
	});
	it('should have the correct outcome for question root[1]', function(){
		var nd = key.root.questions[1].outcome;
		expect( nd.id ).toEqual( "parastacidae" );
		expect( nd.name ).toEqual( "Parastacidae" );
		expect( nd.commonName ).toEqual( "freshwater crayfish or yabbies" );
		expect( nd.size ).toEqual( 300 );
		expect( nd.signalScore ).toEqual( 4 );
		expect( nd.habitat ).toEqual( "Crayfish in rivers (upper photo) yabbies "
			+ "in wetlands/pools (lower photo)." );
		expect( nd.movement ).toEqual( "walking, with sudden flips when disturbed." );
		expect( nd.confusedWith ).toEqual( "Nothing, very distinctive.  We have left "
			+ "crayfish and Yabbies grouped together because they mostly turn up as "
			+ "juveniles in samples and are difficult to separate when young." );
		expect( nd.mediaUrls ).toEqual( 
			[ Ti.Filesystem.resourcesDirectory + '/spec/resources/simpleKey1/media/parastacide_01.jpg',
			  Ti.Filesystem.resourcesDirectory + '/spec/resources/simpleKey1/media/parastacide_02.jpg' ]
		);
	});
	it('should have the correct outcome for root[0][1] (keyNodeRef)', function(){
		var nd = key.root.questions[0].outcome.questions[1].outcome;
		expect( nd.id ).toEqual( "linkTest" );
		expect( nd.questions[0].text ).toEqual( "Question 1 Link Test" );
		expect( nd.questions[1].text ).toEqual( "Question 2 Link Test" );
	});
	it('should have the correct parentLink chain', function(){
		var nd = key.root;
		expect( nd.parentLink ).toBe( null );
		expect( nd.questions[0].outcome.parentLink ).toBe( nd );
		expect( nd.questions[1].outcome.parentLink ).toBe( nd );
	});
	it('should correctly link parents using a keyNodeLink reference', function(){		
		var nd = key.root.questions[0].outcome;
		expect( nd.questions[1].outcome.parentLink ).toBe( nd );
	});
		
	it('should list the speed bug index with getSpeedbugIndex()', function() {
		sbug = key.getSpeedbugIndex();
		expect( sbug ).toBeDefined();
		expect( sbug['maggots'] ).toBeDefined();
		expect( sbug['maggots'] ).toContain( { imgUrl: Ti.Filesystem.resourcesDirectory + '/spec/resources/simpleKey1/media/speedbug/athericidae.svg', refId: "athericidae" } );
		expect( sbug['maggots'] ).toContain( { imgUrl: Ti.Filesystem.resourcesDirectory + '/spec/resources/simpleKey1/media/speedbug/blepheraceridae.svg', refId: "blepheraceridae" }  );
		expect( sbug['ranatra'] ).toContain( { imgUrl: Ti.Filesystem.resourcesDirectory + '/spec/resources/simpleKey1/media/speedbug/ranatra.svg', refId: "ranatra" } );
		expect( sbug['larval'] ).toContain( { imgUrl: Ti.Filesystem.resourcesDirectory + '/spec/resources/simpleKey1/media/speedbug/hydrobiosidae.svg', refId: "hydrobiosidae" } );
		expect( sbug['larval'] ).toContain( { imgUrl: Ti.Filesystem.resourcesDirectory + '/spec/resources/simpleKey1/media/speedbug/megaloptera.svg', refId: "corydalidae" } );
	});
});