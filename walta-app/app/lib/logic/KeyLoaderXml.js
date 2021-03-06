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

var _ = require('underscore');
var XmlUtils = require('../util/XmlUtils');
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
		return nds[0].textContent ;
	} else {
		return "";
	}
}

function parseMediaUrls( key, nd ) {
	var urls = [];
	XmlUtils.childElementsByTag( nd, WALTA_KEY_NS, 'mediaRef',
		function( mr ) {
			var fs = require('fs');
			var mediaRef = key.url + "media/" + mr.getAttribute( 'url' );
			try {
				fs.accessSync(mediaRef, fs.F_OK );
			    urls.push( `${key.mediaPath}/media/${mr.getAttribute( 'url' )}`);
			} catch(e) {
			   console.warn( "Unable to find media reference: '" + mediaRef + "' so not adding media URL" );
			};
		});
	return urls;
}

function parseTaxon( key, nd, scientificName,parentTaxon ) {
	var Taxon = require('./Taxon');

	// Parse this Taxon node
	var xTxn = expectNode( nd, 'taxon' );

	if ( scientificName == null )
	  scientificName = [];
	scientificName.push( { taxonomicLevel: XmlUtils.getAttr( xTxn, 'taxonomicLevel'), name: XmlUtils.getAttr( xTxn, 'name')});
  var newTaxon = Taxon.createTaxon({
		id: XmlUtils.getAttr( xTxn, 'id'),
		name: XmlUtils.getAttr( xTxn, 'name'),
		scientificName: _(scientificName).clone(),
		ref: XmlUtils.getAttr( xTxn, 'ref'),
		commonName: XmlUtils.getAttr( xTxn, 'commonName'),
		size: parseInt( XmlUtils.getAttr( xTxn, 'size') ),
		signalScore: parseInt( XmlUtils.getAttr( xTxn, 'signalScore') ),
		habitat: getText( xTxn, WALTA_KEY_NS, 'habitat'),
		movement: getText( xTxn, WALTA_KEY_NS, 'movement'),
		confusedWith: getText( xTxn, WALTA_KEY_NS, 'confusedWith'),
		mediaUrls: parseMediaUrls( key, xTxn ),
		taxonomicLevel: XmlUtils.getAttr( xTxn, 'taxonomicLevel'),
		description: getText( xTxn, WALTA_KEY_NS, 'description'),
		taxonParent: parentTaxon
	});
	key.attachTaxon(newTaxon);

	// Parse any sub Taxon nodes
	XmlUtils.childElementsByTag( nd, WALTA_KEY_NS, 'taxon',
		function(nd){
			parseTaxon( key, nd, _(scientificName).clone(), newTaxon );
		});
}

function parseQuestion( key, nd, parentLink ) {
	var Question = require('./Question');


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
	XmlUtils.childElementsByTag( nd.parentNode, WALTA_KEY_NS, 'outcome',
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
		Ti.API.debug("Unable to find outcome for question.text = '" + text + "'");
	}
	var qn = Question.createQuestion({
		text: text,
		mediaUrls: media,
		outcome: outcome
	});

	// Store a future reference to resolve this node later
	if ( !_.isUndefined( ref ) && _.isUndefined( outcome ) ) {
		// There needs to be a list of nodes to allow multiple incoming edges to fix #146 and
		// related bugs...
		if ( _.isUndefined( forwardLinks[ref] ))
			forwardLinks[ref] = [];
		forwardLinks[ref].push({ qNode: qn, pLink: parentLink });
	}

	return qn;
}

function parseKeyNode( key, nd ) {
	var kn;

	var Key = require('./Key');

	expectNode( nd, 'keyNode' );

	kn = Key.createKeyNode({
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
	nd = null; // discard native proxies

	key.attachNode( kn );

	// Process any forward links that this node resolves
	if ( !_.isUndefined( kn.id ) ) {
		if ( kn.id in forwardLinks ) {
			// correct each link
			_.each(forwardLinks[kn.id],
				function(link) {
				link.qNode.outcome = kn;
				kn.parentLink = link.pLink; // will clobber previous .. not sure what to do about this
				} );
			delete forwardLinks[kn.id];
		}
	}
	return kn;
}

function parseSpeedBug( key, nd ) {
	var speedbug = key.getSpeedbugIndex();
	expectNode( nd, 'speedBugIndex' );
	XmlUtils.childElements( nd, function( sg ) {
		if ( XmlUtils.isXmlNode( sg, WALTA_KEY_NS, 'speedBugGroup' ) ) {
			speedbug.addSpeedbugGroup( XmlUtils.getAttr( sg, "ref" ) );
			XmlUtils.childElementsByTag( sg, WALTA_KEY_NS, 'speedBugLink',function( sb ) {
				speedbug.addSpeedbugIndex(
					key.mediaPath + "/media/" + XmlUtils.getAttr( sb, "image" ),
					XmlUtils.getAttr( sg, "ref" ),
					XmlUtils.getAttr( sb, "ref" ) );
			});
		} else if ( XmlUtils.isXmlNode( sg, WALTA_KEY_NS, 'speedBugLink' ) ) {
			speedbug.addSpeedbugGroup( XmlUtils.getAttr( sg, "ref" ) );
			speedbug.addSpeedbugIndex(
					key.mediaPath + "/media/" + XmlUtils.getAttr( sg, "image" ),
					XmlUtils.getAttr( sg, "ref" ),
					XmlUtils.getAttr( sg, "ref" ) );
		}
	});
}

function parseKey( node, path ) {
	var Key = require('./Key');
	var xKey = expectNode( node, 'key' );
	var res = Key.createKey( {
		url: path,
		name: xKey.getAttribute( 'name' )
	});
	return res;
}

// takes a variable list of path elements like the getFile() API call does
function loadKey( root, mediaPath ) {
	console.info('Loading key ' + root + "...");
	var xml = XmlUtils.loadXml( root + "key.xml"  );
	var key = parseKey( xml.documentElement, root );
	key.mediaPath = mediaPath;
	console.info('Loading taxon nodes...');
	XmlUtils.childElementsByTag( xml.documentElement, WALTA_KEY_NS, 'taxon', _.partial( parseTaxon, key ) );
	console.info('Loading keyNode nodes...');
	XmlUtils.childElementsByTag( xml.documentElement, WALTA_KEY_NS, 'keyNode', _.partial( parseKeyNode, key ) );
	console.info('Loading speedBugIndex nodes...');
	XmlUtils.childElementsByTag( xml.documentElement, WALTA_KEY_NS, 'speedBugIndex', _.partial( parseSpeedBug, key ) );
	console.info('done.');


	return key;
}

exports.loadKey = loadKey;
