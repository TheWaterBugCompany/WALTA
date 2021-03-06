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

/*
 *  walta/Key
 *
 *  Keeps track of the relationship between KeyNodes, Questions and Taxons and initialises the model
 *  from the supplied key URL.
 *
 *  Key, KeyNode, Question and Taxon constitute the data model describing a key
 */
if ( typeof(_) == "undefined") _ = require('underscore')._;

function createKeyNode( args ) {
	var obj = _(args).defaults({
		id: '',				// The string id of the this node
		ref: null,        // If not null used by SpeedBugIndex
		questions: [],		// An array containing all the Question's relevant to this KeyNode
		parentLink: null,	// A link to the parent KeyNode or null if this is the root
		addQuestion( q ) {
			this.questions.push( q );
		},
		findQuestion( text ) {
			return _(this.questions).find( (q) => q.text.trim() == text );
		}
	});
	return obj;
}

function createKey( args ) {

	// Set up properties
	var obj = _(args).defaults({
		url: null,
		name: null,
		root: null,
		currentDecision: null,
		speedbugIndex: {}
	});

	// Private variables here
	var taxIdToNode = {};
	var taxRefToNode = {};
	var keyRefToNode = {};

	var allNodes = [];

	if ( _.isNull( obj.currentDecision ) ) {
		obj.currentDecision = obj.root;
	}

	obj =  _(obj).extend( {

		// Choose the branch number id i from the current decision.
		choose: function( i ) {
			if ( this.isNode( this.currentDecision ) ) {
				var nd = this.currentDecision.questions[i].outcome;
				if ( _.isUndefined(nd) || _.isNull( nd ) )
					Ti.API.error( "Outcome for " + i + " is not defined!" );

				this.currentDecision = nd;
			} else {
				if ( Ti ) {
					Ti.API.error("choose() called on non key node!");
				}
			}
		},

		// Go backs up the key to the parent
		back: function() {
			if ( ! this.isRoot() ) {
				this.currentDecision = this.currentDecision.parentLink;
			}
		},

		// Reset to the root Node
		reset: function(node) {
			if ( ! node ) node = this.root;
			this.currentDecision = node;
		},

		// Returns true is we are currently at the root node
		isRoot: function() {
			return _.isNull( this.currentDecision.parentLink );
		},

		// Functions to determine if the object looks like a Node or a Taxon ?
		isTaxon: function(node) {
			return _.isUndefined( node.questions );
		},

		isNode: function(node) {
			return ! this.isTaxon( node );
		},

		// Set the cursor to the passed node
		setCurrentNodeObj: function( node ) {
			this.currentDecision = node;
		},

		// Move the current decision to the referenced node
		setCurrentNode: function( refId ) {
			var node = this.findNode( refId );
			if ( _.isUndefined( node ) ) {
				node = this.findTaxon( refId );
				// Redirect to key if we don't have a leaf Taxon
				if ( node.ref != "") {
					node = this.findNode( node.ref );
				}
			}
			if ( _.isUndefined( node ) ) {
				Ti.API.error( "Unable to find key node '" + refId +"'" );
			}

			this.currentDecision = node;
		},

		// Return the current decision
		getCurrentNode: function() {
			return this.currentDecision;
		},

		// Find a KeyNode by ref
		findNode: function( refId ) {
			return keyRefToNode[refId];
		},

		// Find a Taxon by ref
		findTaxon: function( refId ) {
			return taxRefToNode[refId];
		},

		findTaxonById: function( id ) {
			return taxIdToNode[id];
		},


		// Return a list of all Taxons
		findAllTaxons: function() {
			return _.values( taxIdToNode );
		},

		// Return a list of all Taxons
		findAllQuestionsOrTaxons: function() {
			return _(allNodes).reduce( (memo,n) => memo.concat(n.questions), [])
					 .concat( this.findAllTaxons );
		},

		// Retrieves all the media
		findAllMedia: function( prp, taxonsOnly = true ) {
			var media = [];
			if ( ! prp ) prp = 'mediaUrls';
			_.each( (taxonsOnly? this.findAllTaxons() : this.findAllQuestionsOrTaxons() ), function( t ) { 
				if ( t[prp] ) {
					media = media.concat( t[prp] );
				} 
			});
			return media;
		},

		// Used to attach a node to the tree
		// intended to be used by the key loader module
		attachNode: function( node ) {
			if ( node.id  ) {
				keyRefToNode[node.id] = node;
			}
			allNodes.push( node );
		},

		dettachNode: function( node ) {
			if ( node.id  ) {
				delete keyRefToNode[node.id];
			}
			allNodes.splice( allNodes.indexOf( node ), 1 );
		},

		attachTaxon: function( taxon ) {
			if ( taxon.id ) {
				taxRefToNode[taxon.id] = taxon;
			}
			if ( taxon.taxonId ) {
				taxIdToNode[taxon.taxonId] =  taxon;
			}
		},

		linkNodeToParent: function( parent, qn, node ) {
			this.attachNode( node );
			parent.questions[qn].outcome = node;
			node.parentLink = parent;
		},

		addSpeedbugIndex: function( sbIndex ) {
			sbIndex.setKey( this );
			this.speedbugIndex[sbIndex.name] = sbIndex;
		},

		getSpeedbugIndex: function(name) {
			return this.speedbugIndex[name];
		},

		linkTaxonToParent: function( parent, qn, taxon ) {
			this.attachTaxon( taxon );
			parent.questions[qn].outcome = taxon;
			taxon.parentLink = parent;
		},

		setRootNode: function( node ) {
			this.attachNode( node );
			this.root = node;
			this.currentDecision = node;
		},

		getRootNode: function() {
			return this.root;
		}
	});
	
	
	return obj;
}

exports.createKey = createKey;
exports.createKeyNode = createKeyNode;
