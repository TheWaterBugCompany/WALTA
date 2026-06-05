
var _ = require('underscore');
var path = require('path');
var Key = require('./Key');
var Taxon = require('./Taxon');
var Question = require('./Question');
var SpeedbugIndex = require('./SpeedbugIndex');
var { InkDocument } = require('./InkDocument');

/*
	Build-time loader: walks an InkDocument and constructs the WALTA
	Key/Question/Taxon/SpeedbugIndex tree.

	A knot is either a TAXON (it contains a `# taxonId:` tag) or a NODE
	(containing choices). Taxa accumulate tag attributes and get linked
	under the parent Question; nodes have their choices walked, with each
	choice either linking to another knot via divert or to a synthetic
	sub-node formed by deeper-depth choices.
*/
class KeyLoaderInk {
	constructor( root ) {
		this._doc = new InkDocument( path.join( root, 'key.ink' ) );
		this._key = Key.createKey( { url: root } );
		this._knotCache = {};
	}

	// The root entry point (the '' synthetic knot) is the menu of top-level
	// choices: "ALT Key", "Mayfly Muster Speedbug", "Speedbug", "Order
	// Speedbug", "Mayfly start point". The taxonomy lives under "ALT Key" and
	// becomes the actual root of the Key. The three speedbug entries become
	// SpeedbugIndex objects. "Mayfly start point" is unused.
	buildKey() {
		const rootMenu = this.expandKnot( '' );

		const altKey = rootMenu.findQuestion( 'ALT Key' ).outcome;
		this._key.dettachNode( rootMenu );
		altKey.parentLink = null;
		this._key.setRootNode( altKey );

		_.each( [ 'Speedbug', 'Mayfly Muster Speedbug', 'Order Speedbug' ], ( name ) => {
			this.buildSpeedbugIndex( name, rootMenu );
		});

		return this._key;
	}

	expandKnot( knotName ) {
		if ( this._knotCache[knotName] ) return this._knotCache[knotName];

		const knot = this._doc.knot( knotName );
		if ( ! knot ) throw new Error( `Divert target '${knotName}' not found in .ink document` );

		if ( this.isTaxon( knot ) ) {
			const taxon = Taxon.createTaxon( this.taxonArgs( knot ) );
			this._key.attachTaxon( taxon );
			this._knotCache[knotName] = taxon;
			return taxon;
		}

		const node = Key.createKeyNode( { id: knotName } );
		this._key.attachNode( node );
		this._knotCache[knotName] = node;

		this.walkChoices( knot.choices(), node );
		return node;
	}

	buildAnonymousNode( choices ) {
		const node = Key.createKeyNode( {} );
		this._key.attachNode( node );
		this.walkChoices( choices, node );
		return node;
	}

	// Walk a list of Choices, attaching each as a Question on `owner`. The
	// nesting structure already lives in each Choice's `children` from
	// InkDocument.
	walkChoices( choices, owner ) {
		for ( const c of choices ) {
			let question = { text: c.text };
			if ( c.tag && c.tag.name === 'mediaUrls' ) {
				question.mediaUrls = c.tag.parsedValue();
				if ( ! _.isArray( question.mediaUrls ) ) question.mediaUrls = [ question.mediaUrls ];
			}
			question = Question.createQuestion( question );

			let outcome;
			if ( c.divert ) {
				outcome = c.divert.isTerminator()
					? null
					: this.expandKnot( c.divert.target );
			} else {
				outcome = this.buildAnonymousNode( c.children );
			}

			question.outcome = outcome;
			if ( outcome && outcome.parentLink === null ) outcome.parentLink = owner;
			owner.questions.push( question );
		}
	}

	buildSpeedbugIndex( speedbugName, rootMenu ) {
		const entry = _.find( rootMenu.questions, ( q ) => q.text.trim() === speedbugName );
		if ( ! entry ) return;
		const speedBugNode = entry.outcome;
		this._key.dettachNode( speedBugNode );

		const index = SpeedbugIndex.createSpeedbugIndex( speedbugName );

		// Speedbug imgUrl is always a single string downstream (the silhouette
		// is one image), even though questions in general carry mediaUrls as an
		// array. Unwrap here so the SpeedbugIndex tile renders a path string,
		// not a path array.
		const firstUrl = ( q ) => q && q.mediaUrls && q.mediaUrls.length ? q.mediaUrls[0] : undefined;

		_.each( speedBugNode.questions, ( q ) => {
			const sub = q.outcome;
			if ( q.text && sub && sub.questions && sub.questions[0] && (sub.questions[0].text || '').trim().toLowerCase() === 'not sure' ) {
				const notSure = sub.questions.shift();
				const groupId = notSure.outcome.id;
				index.addSpeedbugGroup( groupId );
				_.each( sub.questions, ( q2 ) => {
					index.addSpeedbugIndex( firstUrl( q2 ), groupId, q2.outcome.id );
				});
			} else if ( sub ) {
				index.addSpeedbugGroup( sub.id );
				index.addSpeedbugIndex( firstUrl( q ), sub.id, sub.id );
			}
		});

		this._key.addSpeedbugIndex( index );
	}

	isTaxon( knot ) {
		return _.any( knot.tags(), ( t ) => t.name === 'taxonId' );
	}

	taxonArgs( knot ) {
		const args = { id: knot.name };
		_.each( knot.tags(), ( t ) => { args[t.name] = t.parsedValue(); });
		return args;
	}
}

exports.loadKey = ( root ) => new KeyLoaderInk( root ).buildKey();
