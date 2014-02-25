var _ = require('lib/underscore')._;

var Key = require('logic/Key');
var Question = require('logic/Question');
var Taxon = require('logic/Taxon');
var XmlUtils = require('util/XmlUtils');

var WALTA_KEY_NS = 'http://thewaterbug.net/taxonomy';

// A list of nodes that haven't been seen yet and need to be linked
var forwardLinks = {};

function expectNode( node, tagName ) {
	if ( ! XmlUtils.isXmlNode( node, WALTA_KEY_NS, tagName) ) {
		throw "Expecting a {" + WALTA_KEY_NS + "}" + tagName 
				+ " but got {" + node.namespaceURI + "}" + node.tagName + " instead?";
	} else {
		return node;
	}
}

function getText( node, ns, tagName ) {
	var nds = [];
	XmlUtils.childElementsByTag( node, ns, tagName, function( nd ) { nds.push(nd); } );
	if ( nds.length > 0 ) {
		return nds[0].getTextContent();
	} else {
		return undefined;
	}
}

function parseMediaUrls( key, nd ) {
	var urls = [];
	XmlUtils.childElementsByTag( nd, WALTA_KEY_NS, 'mediaRef',
		function( mr ) {
			urls.push( key.url + "media/" + mr.getAttribute( 'url' ) );
			
		});
	return urls;
}

function parseTaxon( key, nd ) {
	// Parse this Taxon node
	var xTxn = expectNode( nd, 'taxon' );
	key.attachTaxon(
		Taxon.createTaxon({
			id: XmlUtils.getAttr( xTxn, 'id'),
			name: XmlUtils.getAttr( xTxn, 'name'),
			commonName: XmlUtils.getAttr( xTxn, 'commonName'),
			size: parseInt( XmlUtils.getAttr( xTxn, 'size') ),
			signalScore: parseInt( XmlUtils.getAttr( xTxn, 'signalScore') ),
			habitat: getText( xTxn, WALTA_KEY_NS, 'habitat'),
			movement: getText( xTxn, WALTA_KEY_NS, 'movement'),
			confusedWith: getText( xTxn, WALTA_KEY_NS, 'confusedWith'),
			mediaUrls: parseMediaUrls( key, xTxn ),
			taxonomicLevel: XmlUtils.getAttr( xTxn, 'taxonomicLevel')
		})
	);
	
	// Parse any sub Taxon nodes
	XmlUtils.childElementsByTag( nd, WALTA_KEY_NS, 'taxon', 
		function(nd){
			parseTaxon( key, nd );
		});
}

function parseQuestion( key, nd, parentLink ) {
	
	// Parse the attributes
	var num = XmlUtils.getAttr( nd, 'num' );
	var text = getText( nd, WALTA_KEY_NS, 'text' );
	var media = parseMediaUrls( key, nd );
	
	if ( _.isUndefined( num ) ) {
		throw "Missing num attribute on question node: " + text;
	}
	
	var outcome = undefined;
	var ref = undefined;
	var foundOutcome = false;
	
	// Search for outcome for this question num
	XmlUtils.childElementsByTag( nd.getParentNode(), WALTA_KEY_NS, 'outcome', 
		function( nd ) {
			if ( XmlUtils.getAttr( nd, 'for' ) == num ) {
				
				var nd2 = XmlUtils.getFirstChildElement( nd );
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
						ref = XmlUtils.getAttr( nd2, 'ref' );
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
	expectNode( nd, 'keyNode' );
	var kn = Key.createKeyNode({
			id: XmlUtils.getAttr( nd, 'id'),
			questions: []
	});
		
	if ( _.isNull(key.root) ) {
		key.setRootNode( kn );
	}
	
	XmlUtils.childElementsByTag( nd, WALTA_KEY_NS, 'question',
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

function parseSpeedBug( key, nd ) {
	expectNode( nd, 'speedBugIndex' );
	XmlUtils.childElements( nd, function( sg ) {
		if ( XmlUtils.isXmlNode( sg, WALTA_KEY_NS, 'speedBugGroup' ) ) {
			XmlUtils.childElementsByTag( sg, WALTA_KEY_NS, 'speedBugLink',function( sb ) {
				key.addSpeedbugIndex( 
					key.url + "media/" + XmlUtils.getAttr( sb, "image" ), 
					XmlUtils.getAttr( sg, "ref" ),
					XmlUtils.getAttr( sb, "ref" ) );
			});
		} else if ( XmlUtils.isXmlNode( sg, WALTA_KEY_NS, 'speedBugLink' ) ) {
			key.addSpeedbugIndex( 
					key.url + "media/" + XmlUtils.getAttr( sg, "image" ), 
					XmlUtils.getAttr( sg, "ref" ),
					XmlUtils.getAttr( sg, "ref" ) );
		}
	});
}

function parseKey( node, path ) {
	var xKey = expectNode( node, 'key' );
	return Key.createKey( {
		url: path,
		name: xKey.getAttribute( 'name' )
	});
}

// takes a variable list of path elements like the getFile() API call does
function loadKey( root ) {
	var xml = XmlUtils.loadXml( root + "key.xml"  );
	var key = parseKey( xml.documentElement, root );
	XmlUtils.childElementsByTag( xml.documentElement, WALTA_KEY_NS, 'taxon', _.partial( parseTaxon, key ) );
	XmlUtils.childElementsByTag( xml.documentElement, WALTA_KEY_NS, 'keyNode', _.partial( parseKeyNode, key ) );
	XmlUtils.childElementsByTag( xml.documentElement, WALTA_KEY_NS, 'speedBugIndex', _.partial( parseSpeedBug, key ) );
	return key;
}

exports.loadKey = loadKey;