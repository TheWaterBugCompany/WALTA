
/*
 *  walta/Key
 *
 *  Keeps track of the relationship between KeyNodes, Questions and Taxons and initialises the model
 *  from the supplied key URL.
 *
 *  Key, KeyNode, Question and Taxon constitute the data model describing a key
 */
if ( typeof(_) == "undefined") _ = require('underscore')._;
var Logger = require('util/Logger');
var error = (m, tag = "key") => Logger.error(m, tag);

// Every route from the root down to a taxon (root first, taxon last). The key is
// a DAG rather than a tree — several nodes have more than one parent — so a taxon
// can sit at the end of more than one route, and a node's single `parentLink`
// names only whichever one the loader happened to store last.
function routesToTaxa( root ) {
	var routes = [];
	(function walk( node, trail ) {
		// A node already on this trail would be a cycle; the key has none today,
		// and skipping makes that a missing route rather than a hang.
		if ( _(trail).contains( node ) ) return;
		trail = trail.concat( node );
		if ( _.isUndefined( node.questions ) ) { routes.push( trail ); return; }
		node.questions.forEach( ( q ) => walk( q.outcome, trail ) );
	})( root, [] );
	return routes;
}

// Keep only the routes the reader is recorded as having walked. A route stored
// before a taxonomy edit no longer traces real edges and simply matches nothing,
// so a stale one needs no validating — it falls back to every route, which is
// the best guess available without knowing how the reader got there.
function narrowToWalked( routes, walkedRefs ) {
	if ( ! walkedRefs ) return routes;
	var walked = routes.filter( ( r ) =>
		r.length === walkedRefs.length && r.every( ( n, i ) => n.id === walkedRefs[i] ) );
	return walked.length ? walked : routes;
}

// The index at which two routes part, or -1 if one is a prefix of the other.
function firstDivergence( a, b ) {
	var limit = Math.min( a.length, b.length );
	for ( var i = 0; i < limit; i++ ) {
		if ( a[i] !== b[i] ) return i;
	}
	return -1;
}

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
					error( "Outcome for " + i + " is not defined!" );

				this.currentDecision = nd;
			} else {
				if ( Ti ) {
					error("choose() called on non key node!");
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
				error( "Unable to find key node '" + refId +"'" );
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
					var urls = t[prp];
					urls.forEach( url => {
						media.push({
							url: url,
							taxon: t
						})
					})
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
		},

		// The couplet where the two identifications part, plus the outcome on either
		// side of it — everything the key search needs to mark one branch right and
		// the other wrong. The refs name the nodes the branches lead to, which is
		// what a question's outcome carries.
		//
		// Both taxa are looked up by taxonId rather than ref because a taxonId can
		// sit at more than one place in the key, and either place is a legitimate
		// answer. Of every route to either, the pair that parts *latest* names the
		// question the reader actually had to tell the two animals apart on.
		hintForIncorrectDecision: function( { selectedTaxonId, expectedTaxonId, selectedRoute = null } ) {
			var routes = routesToTaxa( this.root );
			var routesFor = ( taxonId ) => routes.filter(
				( r ) => String( _.last( r ).taxonId ) === String( taxonId ) );
			var expected = routesFor( expectedTaxonId );
			var best = null;
			narrowToWalked( routesFor( selectedTaxonId ), selectedRoute )
				.forEach( ( s ) => expected.forEach( ( e ) => {
					var i = firstDivergence( s, e );
					if ( i > 0 && ( best === null || i > best.i ) ) best = { i, s, e };
				}));
			if ( ! best ) return null;
			return {
				nodeId: best.s[best.i-1].id,
				correctRef: best.e[best.i].id,
				incorrectRef: best.s[best.i].id,
				route: best.s.slice( 0, best.i ).map( ( n ) => n.id )
			};
		}
	});
	
	
	return obj;
}

exports.createKey = createKey;
exports.createKeyNode = createKeyNode;
