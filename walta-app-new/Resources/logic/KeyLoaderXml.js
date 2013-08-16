var _ = require('lib/underscore')._;

var Key = require('logic/Key');
var Question = require('logic/Question');
var Taxon = require('logic/Taxon');

var WALTA_KEY_NS = 'http://thewaterbug.net/taxonomy';

// A list of nodes that haven't been seen yet and need to be linked
var forwardLinks = {};

function loadXml( path ) {
	// Load a DOM Level 2 respresentation of the XML file
	var file = Ti.Filesystem.getFile( Ti.Filesystem.resourcesDirectory, path );
	return Ti.XML.parseString( file.read().text );
}

function isXmlNode( node, tagName, ns ) {
	return ( node.tagName === tagName && node.namespaceURI === ns );
}

function childElementsByTag( node, tagName, ns ) {
	var nds = [];
	iterateXmlNodeList( node.getChildNodes(), function(nd) {
		if ( isXmlNode( nd, tagName, ns ) ) {
			nds.push( nd );
		}
	});
}

function iterateXmlNodeList( nodeList, func ) {
	for( var i = 0; i < nodeList.length; i++ ) {
		func( nodeList.item( i ) );
	}
}

function expectNode( node, tagName ) {
	if ( ! isXmlNode( node, tagName, WALTA_KEY_NS ) ) {
		throw "Expecting a {" + WALTA_KEY_NS + "}" + tagName 
				+ " but got {" + node.namespaceURI + "}" + node.tagName + " instead?";
	} else {
		return node;
	}
}

function getAttr( node, attrName ) {
	if ( node.hasAttribute( attrName ) ) {
		return node.getAttribute( attrName );
	} else {
		return undefined;
	}
}

function getText( node, tagName ) {
	var nds = childElementsByTag( node, tagName, WALTA_KEY_NS );
	if ( nds.length > 0 ) {
		return nds[0].getTextContent();
	} else {
		return undefined;
	}
}

function parseMediaUrls( nd ) {
	var urls = [];
	_(childElementsByTag( node, 'mediaRef', WALTA_KEY_NS )).each(function( mr ) {
		urls.push( mr.getAttribute( 'url' ) );
	});
	return urls;
}

function parseTaxon( key, nd ) {
	// Parse this Taxon node
	var xTxn = expectNode( nd, 'taxon' );
	key.attachTaxon(
		Taxon.createTaxon({
			id: getAttr( xTxn, 'id'),
			name: getAttr( xTxn, 'name'),
			commonName: getAttr( xTxn, 'commonName'),
			size: getAttr( xTxn, 'size'),
			signalScore: getAttr( xTxn, 'signalScore'),
			habitat: getText( xTxn, 'habitat' ),
			movement: getText( xTxn, 'movement' ),
			confusedWith: getText( xTxn, 'confusedWith' ),
			mediaUrls: parseMediaUrls( xTxn )
		})
	);
	
	// Parse any sub Taxon nodes
	_(childElementsByTag( nd, 'taxon', WALTA_KEY_NS )).each( 
		function(nd){
			parseTaxon( key, nd );
		});
}

function parseQuestion( key, nd, parentLink ) {
	
	// Parse the attributes
	var num = getAttr( nd, 'num' );
	var text = getText( nd, 'text' );
	var media = parseMediaUrls( nd );
	
	if ( _.isUndefined( num ) ) {
		throw "Missing num attribute on question node: " + text;
	}
	
	var outcome = undefined;
	var ref = undefined;
	
	// Search for outcome for this question num
	_(childElementsByTag( nd.getParentNode(), 'outcome', WALTA_KEY_NS )).each(
		function( nd ) {
			if ( getAttr( nd, 'for' ) == num ) {
				var nd2 = nd.getFirstChild();
				// If it is a nested keyNode then recursive descent
				if ( nd2.tagName === 'keyNode' ) {
					outcome = parseKeyNode( key, nd2 );
					outcome.parentLink = parentLink;
				} 
				// If it is a link then deference if possible, otherwise add to futureLinks
				// to resolve if the node is found in the future.
				else if ( nd2.tagName === 'taxonLink' || nd2.tagName === 'keyNodeLink' ) {
					ref = getAttr( nd2, 'ref' );
					if ( _.isUndefined( ref ) ) {
						throw "Missing ref attribute on outcome for question node: " + text;
					} else {
						outcome = ( nd2.tagName === 'taxonLink' ? key.findTaxon( ref ) : key.findNode( ref ) );	
						outcome.parentLink = parentLink;
					}			 
				} 
			}	
		});

	// Create the question node
	var qn = Question.createQuestion({
		text: text,
		mediaUrls: media,
		outcome: outcome
	});	
		
	// Store a future reference to resolve this node later
	if ( !_.isUndefined( ref ) && _.isUndefined( outcome ) ) {
		forwardLinks[ref] = { qNode: qn, pLink: parentLink };
	}
}

function parseKeyNode( key, nd ) {
	var xKeyNode = expectNode( nd, 'keyNode' );
	var kn = Key.createKeyNode({
			id: getAttr( nd, 'id'),
			questions: []
		})
	_(childElementsByTag( nd, 'question', WALTA_KEY_NS )).each(
		function( nd ) {
			kn.questions.push( parseQuestion( key, nd, kn ) );
		});
	
	key.attachNode( kn );
	
	// Process any forward links that this node resolves
	if ( !_.isUndefined( kn.id ) ) {
		if ( kn.id in forwardLinks ) {
			var link = forwardLinks[kn.id];
			link.qNode.outcome = kn;
			kn.parentLink = link.parentLink;
			delete forwardLinks[kn.id];
		}
	}
}

function parseKey( node, path ) {
	var xKey = expectNode( node, 'key' );
	return Key.createKey( {
		url: path,
		name: xKey.getAttribute( 'name' )
	});
}

function loadKey( path ) {
	var xml = loadXml( path + "/key.xml" );
	var key = parseKey( xml.documentElement, path );
	_(childElementsByTag( xml.documentElement, 'taxon', WALTA_KEY_NS )).each( _.partial( parseTaxon, key ) );
	_(childElementsByTag( xml.documentElement, 'keyNode', WALTA_KEY_NS )).each( _.partial( parseKeyNode, key ) );
	return key;
}


exports.loadKey = loadKey;