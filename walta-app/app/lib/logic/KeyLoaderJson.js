if ( typeof(_) == "undefined") _ = require('underscore')._;
var CircularJSON = require('lib/circular-json');
var Key = require('logic/Key');
var Question = require('logic/Question');
var Taxon = require('logic/Taxon');
var SpeedbugIndex = require('./SpeedbugIndex');
var Logger = require('util/Logger');
var debug = (m, tag = "key") => Logger.debug(m, tag);


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
			debug(`Rehyrdating ${sbObj.name}`);
			var sbIndex = SpeedbugIndex.createSpeedbugIndex(sbObj.name,key);
			sbIndex.setSpeedbugIndex( sbObj.speedbugIndexInternal );
			key.addSpeedbugIndex( sbIndex );
		});
}

// loads a key from a circular-json persisted object
function loadKey( root ) {
	var fileText;
	var filePath = root + "key.json" ;
	if ( typeof Ti !== "undefined" ) {
		fileText = Ti.Filesystem.getFile(filePath).read().text;
	} else {
		fileText = require('fs').readFileSync(filePath, 'utf8' );
	}
	var key = CircularJSON.parse( fileText );
	key.url = root;

	var rehydrated = rehydrateKey( key );
	rehydrateSpeedBug( key );

	return rehydrated;
}

exports.loadKey = loadKey;
