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
require("specs/lib/ti-mocha");
var { expect } = require('specs/lib/chai');
if ( typeof(_) == "undefined") _ = require('underscore')._;

var Key = require('logic/Key');
var Question = require('logic/Question');
var Taxon = require('logic/Taxon');
var KeyLoaderXml = require('logic/KeyLoaderXml');

describe('KeyLoaderXml', function() {
	var key;
	it('should load a key from XML', function(){
		key = KeyLoaderXml.loadKey( Ti.Filesystem.resourcesDirectory + '/spec/resources/simpleKey1/' );
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
	it('should have the correct outcome for question root[1][1]', function(){
		var nd = key.root.questions[1].outcome.questions[1].outcome;
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
		var p1 = key.root.questions[0].outcome;
		var p2 = key.root.questions[1].outcome;
		var parent = key.root.questions[1].outcome.questions[0].outcome.parentLink;
		expect( parent === p1 || parent === p2 ).toEqual( true ); // Could be either parent not defined which one
	});

	it('should correctly link from 2nd parent using a keyNodeLink reference (can be a graph)', function(){
		var nd = key.root.questions[1].outcome.questions[0].outcome;
		expect( nd.id ).toEqual( "linkTest" );
	});

	it('should list the speed bug index with getSpeedbugIndex()', function() {
		sbug = key.getSpeedbugIndex();
		expect( sbug ).toBeDefined();
		expect( sbug['maggots'].bugs ).toBeDefined();
		expect( sbug['maggots'].bugs ).toContain( { imgUrl: Ti.Filesystem.resourcesDirectory + '/spec/resources/simpleKey1/media/speedbug/athericidae.svg', refId: "athericidae" } );
		expect( sbug['maggots'].bugs ).toContain( { imgUrl: Ti.Filesystem.resourcesDirectory + '/spec/resources/simpleKey1/media/speedbug/blepheraceridae.svg', refId: "blepheraceridae" }  );
		expect( sbug['ranatra'].bugs ).toContain( { imgUrl: Ti.Filesystem.resourcesDirectory + '/spec/resources/simpleKey1/media/speedbug/ranatra.svg', refId: "ranatra" } );
		expect( sbug['larval'].bugs ).toContain( { imgUrl: Ti.Filesystem.resourcesDirectory + '/spec/resources/simpleKey1/media/speedbug/hydrobiosidae.svg', refId: "hydrobiosidae" } );
		expect( sbug['larval'].bugs ).toContain( { imgUrl: Ti.Filesystem.resourcesDirectory + '/spec/resources/simpleKey1/media/speedbug/megaloptera.svg', refId: "corydalidae" } );
	});
});
