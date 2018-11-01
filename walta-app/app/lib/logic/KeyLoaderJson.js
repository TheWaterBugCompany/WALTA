/*
 	The Waterbug App - Dichotomous key based insect identification
    Copyright (C) 2014 The Waterbug Company

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
if ( typeof(_) == "undefined") _ = require('underscore')._;
var CircularJSON = require('lib/circular-json');
var Key = require('logic/Key');
var Question = require('logic/Question');
var Taxon = require('logic/Taxon');
var SpeedbugIndex = require('./SpeedbugIndex');


// attach proper classes to key from plain json object hierarchy
function rehydrateKey( key, node ) {
	// first create the top level
	if (node === undefined ) {
	 	rehydrateKey( Key.createKey( key ), key.root );
	 	return key;
	}
	// are we a decision node?
	else if ( key.isNode( node ) ) {
		_.each( node.questions, function(qn) {
			Question.createQuestion( qn );
			rehydrateKey( key, qn.outcome );
		} );
		key.attachNode( Key.createKeyNode( node ) );
		return node;
	}
	// nope must be a taxon node
	else {
		key.attachTaxon( Taxon.createTaxon( node ) );
		return node;
	}
	
}

function rehydrateSpeedBug( key ) {
	_(key.speedbugIndex)
		.mapObject( (sbObj) => {
			Ti.API.info(`Rehyrdating ${sbObj.name}`);
			var sbIndex = SpeedbugIndex.createSpeedbugIndex(sbObj.name,key);
			sbIndex.setSpeedbugIndex( sbObj.speedbugIndexInternal );
			key.addSpeedbugIndex( sbIndex );
		});
}

// loads a key from a circular-json persisted object
function loadKey( root ) {

	var file = Ti.Filesystem.getFile( root + "key.json" );
	var key = CircularJSON.parse( file.read().text );
	key.url = root;

	var rehydrated = rehydrateKey( key );
	rehydrateSpeedBug( key );

	return rehydrated;
}

exports.loadKey = loadKey;
