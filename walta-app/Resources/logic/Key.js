/*
 *  walta/Key
 *   
 *  Keeps track of the relationship between KeyNodes, Questions and Taxons and initialises the model 
 *  from the supplied key URL. 
 *  
 *  Key, KeyNode, Question and Taxon constitute the data model describing a key
 */
var _ = require('lib/underscore')._;

function createKeyNode( args ) {
	var obj = _(args).defaults({
		id: '',				// The string id of the this node
		questions: [],		// An array containing all the Question's relevant to this KeyNode
		parentLink: null	// A link to the parent KeyNode or null if this is the root
	});
	return obj;
}

function createKey( args ) {
	
	// Set up properties
	var obj = _(args).defaults({
		url: null,
		name: null,
		root: null,
		currentDecision: null
	});
	
	// Private variables here
	var taxIdToNode = {};
	var keyIdToNode = {};
	var speedBugIndex = {};
	
	if ( _.isNull( obj.currentDecision ) ) {
		obj.currentDecision = obj.root;
	}
	
	return _(obj).extend( {
		
		// Choose the branch number id i from the current decision.
		choose: function( i ) {
			this.currentDecision = this.currentDecision.questions[i].outcome;
		},
		
		// Go backs up the key to the parent
		back: function() {
			if ( ! this.isRoot() ) {
				this.currentDecision = this.currentDecision.parentLink;
			}
		},
		
		// Reset to the root Node
		reset: function() {
			this.currentDecision = this.root;
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
		
		// Move the current decision to the referenced node
		setCurrentNode: function( refId ) {
			var node = this.findNode( refId );
			if ( _.isUndefined( node ) ) {
				node = this.findTaxon( refId );
			} 
			if ( _.isUndefined( node ) ) {
				throw "Unable to find key node '" + refId +"'";
			}
			
			this.currentDecision = node;
		},
		
		// Return the current decision
		getCurrentNode: function() {
			return this.currentDecision;
		},
		
		// Find a KeyNode by id
		findNode: function( refId ) {
			return keyIdToNode[refId];
		},
		
		// Find a Taxon by id
		findTaxon: function( refId ) {
			return taxIdToNode[refId];
		},
		
		// Return a list of all Taxons
		findAllTaxons: function() {
			return _.values( taxIdToNode );
		},
		
		// Used to attach a node to the tree
		// intended to be used by the key loader module
		attachNode: function( node ) {
			if ( ! _.isUndefined( node.id ) ) {
				keyIdToNode[node.id] = node;
			}
		},
		
		linkNodeToParent: function( parent, qn, node ) {
			this.attachNode( node );
			parent.questions[qn].outcome = node;
			node.parentLink = parent;
		},
		
		attachTaxon: function( taxon ) {
			if ( ! _.isUndefined( taxon.id ) ) {
				taxIdToNode[taxon.id] = taxon;
			}
		},
		
		linkTaxonToParent: function( parent, qn, taxon ) {
			this.attachTaxon( taxon );
			parent.questions[qn].outcome = taxon;
			taxon.parentLink = parent;
		},
		
		// Adds a "Speed Bug" link, this allows a special index
		// to be displayed that jumps directly to a node within
		// a key by touching a silhouette image.
		addSpeedbugIndex: function( imgUrl, grpId, refId) {
			if ( ! _(speedBugIndex).has(grpId) ) {
				speedBugIndex[grpId] = [];
			} 
			speedBugIndex[grpId].push( { imgUrl: imgUrl, refId: refId } );
		},
		
		getSpeedbugIndex: function() {
			return speedBugIndex;
		},
		
		setRootNode: function( node ) {
			this.attachNode( node );
			this.root = node;
			if ( _.isNull(this.currentDecision) ) {
				this.currentDecision = node;
			}
		},
		
		getRootNode: function() {
			return this.root;
		}
	});
}

exports.createKey = createKey;
exports.createKeyNode = createKeyNode;