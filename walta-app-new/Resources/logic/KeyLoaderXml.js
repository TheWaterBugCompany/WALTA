var _ = require('lib/underscore')._;

var Key = require('logic/Key');
var Question = require('logic/Question');
var Taxon = require('logic/Taxon');

var WALTA_KEY_NS = 'http://thewaterbug.net/taxonomy';

// A list of nodes that haven't been seen yet and need to be linked
var forwardLinks = {};

Ti.XML.applyProperties({
	namespaceAware: true
});

function loadXml( path ) {
	// Load a DOM Level 2 respresentation of the XML file
	var file = Ti.Filesystem.getFile( Ti.Filesystem.resourcesDirectory, path );
	return Ti.XML.parseString( file.read().text );
}

function isXmlNode( node, tagName, ns ) {
	return ( node.tagName === tagName && node.namespaceURI === ns );
}

// Searches for the first Element child of node
function getFirstChildElement( node ) {
	if ( ! node.hasChildNodes() ) return null;
	var cs = node.getChildNodes();
	var rn = null;
	var i = 0;
	while( _.isNull(rn) && i < cs.length ) {
		var c = cs.item(i++);
		if ( c.nodeType === node.ELEMENT_NODE ) {
			rn = c;
		}
	}
	return rn;
}

function childElementsByTag( node, tagName, ns, func ) {
	iterateXmlNodeList( node.getChildNodes(), function(nd) {
		if ( isXmlNode( nd, tagName, ns ) ) {
			func( nd );
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
	var nds = [];
	childElementsByTag( node, tagName, WALTA_KEY_NS, function( nd ) { nds.push(nd); } );
	if ( nds.length > 0 ) {
		return nds[0].getTextContent();
	} else {
		return undefined;
	}
}

function parseMediaUrls( key, nd ) {
	var urls = [];
	childElementsByTag( nd, 'mediaRef', WALTA_KEY_NS,
		function( mr ) {
			urls.push( key.url + "/media/" + mr.getAttribute( 'url' ) );
			
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
			mediaUrls: parseMediaUrls( key, xTxn )
		})
	);
	
	// Parse any sub Taxon nodes
	childElementsByTag( nd, 'taxon', WALTA_KEY_NS, 
		function(nd){
			parseTaxon( key, nd );
		});
}

function parseQuestion( key, nd, parentLink ) {
	
	// Parse the attributes
	var num = getAttr( nd, 'num' );
	var text = getText( nd, 'text' );
	var media = parseMediaUrls( key, nd );
	
	if ( _.isUndefined( num ) ) {
		throw "Missing num attribute on question node: " + text;
	}
	
	var outcome = undefined;
	var ref = undefined;
	var foundOutcome = false;
	
	// Search for outcome for this question num
	childElementsByTag( nd.getParentNode(), 'outcome', WALTA_KEY_NS, 
		function( nd ) {
			if ( getAttr( nd, 'for' ) == num ) {
				
				var nd2 = getFirstChildElement( nd );
				if ( ! _.isNull( nd2 ) ) {
					// If it is a nested keyNode then recursive descent
					if ( nd2.tagName === 'keyNode' ) {
						foundOutcome = true;
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
							foundOutcome = true;
							outcome = ( nd2.tagName === 'taxonLink' ? key.findTaxon( ref ) : key.findNode( ref ) );	
							if ( ! _.isUndefined(outcome) ) {
								outcome.parentLink = parentLink;
							}
						}			 
					} 
				}
			}	
		});

	// Create the question node
	if ( !foundOutcome ) {
		Ti.API.info("Unable to find outcome for question.text = '" + text + "'");
	}
	var qn = Question.createQuestion({
		text: text,
		mediaUrls: media,
		outcome: outcome
	});	
		
	// Store a future reference to resolve this node later
	if ( !_.isUndefined( ref ) && _.isUndefined( outcome ) ) {
		forwardLinks[ref] = { qNode: qn, pLink: parentLink };
	}
	
	return qn;
}

function parseKeyNode( key, nd ) {
	var xKeyNode = expectNode( nd, 'keyNode' );
	var kn = Key.createKeyNode({
			id: getAttr( nd, 'id'),
			questions: []
	});
		
	if ( _.isNull(key.root) ) {
		key.setRootNode( kn );
	}
	
	childElementsByTag( nd, 'question', WALTA_KEY_NS,
		function( nd ) {
			kn.questions.push( parseQuestion( key, nd, kn ) );
		});
	
	key.attachNode( kn );

	
	// Process any forward links that this node resolves
	if ( !_.isUndefined( kn.id ) ) {
		if ( kn.id in forwardLinks ) {
			var link = forwardLinks[kn.id];
			link.qNode.outcome = kn;
			kn.parentLink = link.pLink;
			delete forwardLinks[kn.id];
		}
	}
	
	return kn;
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
	childElementsByTag( xml.documentElement, 'taxon', WALTA_KEY_NS, _.partial( parseTaxon, key ) );
	childElementsByTag( xml.documentElement, 'keyNode', WALTA_KEY_NS, _.partial( parseKeyNode, key ) );
	return key;
}


exports.loadKey = loadKey;