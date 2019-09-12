/*
 	The Waterbug App - Dichotomous key based insect identification
    Copyright (C) 2014 Copyright (C) 2014 The Waterbug Company

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
require("unit-test/lib/mocha");
var { expect } = require('unit-test/lib/chai');
if ( typeof(_) == "undefined") _ = require('underscore')._;

var Key = require('logic/Key');
var Question = require('logic/Question');
var Taxon = require('logic/Taxon');
var KeyLoaderXml = require('logic/KeyLoaderXml');

describe('KeyLoaderXml', function() {
	var key;
	it('should load a key from XML', function(){
		key = KeyLoaderXml.loadKey( 'unit-test/resources/simpleKey1/' );
		expect( key ).to.be.ok;
	});
	it('should have the correct toplevel node', function(){
		var nd = key.root;
		expect( nd.questions.length ).to.equal( 2 );
		expect( nd.questions[0].text ).to.equal(
			"Animals strongly flattened from the sides (like dogs and cats); "
			+ "often lying on their side or moving with their side flat against "
			+ "the substrate." );
		expect( nd.questions[0].mediaUrls ).to.deep.equal(
			[ 'unit-test/resources/simpleKey1/media/couplet5p1.gif' ]
		);
		expect( nd.questions[1].text ).to.equal(
			"Animals not flattened or flattened 'front to back' (like humans or "
			+ "cockroaches)." );
		expect( nd.questions[1].mediaUrls ).to.deep.equal(
			[ 'unit-test/resources/simpleKey1/media/couplet5p2.gif' ]
		);

	});
	it('should have the correct outcome for question root[0]', function(){
		var nd = key.root.questions[0].outcome;
		expect( nd.questions.length ).to.equal( 2 );
		expect( nd.questions[0].text ).to.equal(
			"Animal rests on its side, swims in swift bursts (below left)." );

	});
	it('should have the correct outcome for question root[1][1]', function(){
		var nd = key.root.questions[1].outcome.questions[1].outcome;
		expect( nd.id ).to.equal( "parastacidae" );
		expect( nd.name ).to.equal( "Parastacidae" );
		expect( nd.commonName ).to.equal( "freshwater crayfish or yabbies" );
		expect( nd.size ).to.equal( 300 );
		expect( nd.signalScore ).to.equal( 4 );
		expect( nd.habitat ).to.equal( "Crayfish in rivers (upper photo) yabbies "
			+ "in wetlands/pools (lower photo)." );
		expect( nd.movement ).to.equal( "walking, with sudden flips when disturbed." );
		expect( nd.confusedWith ).to.equal( "Nothing, very distinctive.  We have left "
			+ "crayfish and Yabbies grouped together because they mostly turn up as "
			+ "juveniles in samples and are difficult to separate when young." );
		expect( nd.mediaUrls ).to.deep.equal(
			[ 'unit-test/resources/simpleKey1/media/parastacide_01.jpg',
			  'unit-test/resources/simpleKey1/media/parastacide_02.jpg' ]
		);
	});
	it('should have the correct outcome for root[0][1] (keyNodeRef)', function(){
		var nd = key.root.questions[0].outcome.questions[1].outcome;
		expect( nd.id ).to.equal( "linkTest" );
		expect( nd.questions[0].text ).to.equal( "Question 1 Link Test" );
		expect( nd.questions[1].text ).to.equal( "Question 2 Link Test" );
	});
	it('should have the correct parentLink chain', function(){
		var nd = key.root;
		expect( nd.parentLink ).to.equal( null );
		expect( nd.questions[0].outcome.parentLink ).to.equal( nd );
		expect( nd.questions[1].outcome.parentLink ).to.equal( nd );
	});
	it('should correctly link parents using a keyNodeLink reference', function(){
		var p1 = key.root.questions[0].outcome;
		var p2 = key.root.questions[1].outcome;
		var parent = key.root.questions[1].outcome.questions[0].outcome.parentLink;
		expect( parent === p1 || parent === p2 ).to.equal( true ); // Could be either parent not defined which one
	});

	it('should correctly link from 2nd parent using a keyNodeLink reference (can be a graph)', function(){
		var nd = key.root.questions[1].outcome.questions[0].outcome;
		expect( nd.id ).to.equal( "linkTest" );
	});

	it('should list the speed bug index with getSpeedbugIndex()', function() {
		sbug = key.getSpeedbugIndex().getSpeedbugIndex(); // FIXME: I know: weird API

		expect( sbug ).to.be.ok;

		expect( sbug['maggots'].bugs ).to.be.ok;
		expect( sbug['maggots'].bugs ).to.deep.include.members( [{ imgUrl: 'unit-test/resources/simpleKey1/media/speedbug/athericidae.svg', refId: "athericidae" }] );
		expect( sbug['maggots'].bugs ).to.deep.include.members( [{ imgUrl: 'unit-test/resources/simpleKey1/media/speedbug/blepheraceridae.svg', refId: "blepheraceridae" }]  );

		expect( sbug['testNode2'].bugs ).to.be.ok;
		expect( sbug['testNode2'].bugs ).to.deep.include.members( [{ imgUrl: 'unit-test/resources/simpleKey1/media/speedbug/ranatra.svg', refId: "testNode2" }] );

		expect( sbug['larval'].bugs ).to.be.ok;
		expect( sbug['larval'].bugs ).to.deep.include.members( [{ imgUrl: 'unit-test/resources/simpleKey1/media/speedbug/hydrobiosidae.svg', refId: "dummyTaxon1" }] );
		expect( sbug['larval'].bugs ).to.deep.include.members( [{ imgUrl: 'unit-test/resources/simpleKey1/media/speedbug/megaloptera.svg', refId: "corydalidae" }] );
	});

	it('should corectly find silohuettes from taxon nodes', function() {
		let sbug = key.getSpeedbugIndex(),
				taxon1 = key.findAllTaxons()[0],
				taxon2 = key.findTaxon("dummyTaxon1");

		expect( sbug ).to.be.ok;
		expect( taxon1, "parastacidae" ).to.be.ok;
		expect( taxon2, "dummyTaxon1" ).to.be.ok;

		expect( taxon1.id ).to.equal( "parastacidae" );
		expect( taxon2.id ).to.equal( "dummyTaxon1" );

		expect( sbug.findSilhouette( taxon1 ) ).to.equal("unit-test/resources/simpleKey1/media/speedbug/ranatra.svg");
		expect( sbug.findSilhouette( taxon2 ) ).to.equal("unit-test/resources/simpleKey1/media/speedbug/hydrobiosidae.svg");


	});
});
