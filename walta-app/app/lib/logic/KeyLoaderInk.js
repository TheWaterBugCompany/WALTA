
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var Key = require('./Key');
var Taxon = require('./Taxon');
var Question = require('./Question');
var SpeedbugIndex = require('./SpeedbugIndex');

/*
	Build-time loader: reads the .ink source files directly and constructs the
	WALTA Key/Question/Taxon/SpeedbugIndex tree. The dichotomous key uses only
	a tiny subset of Inkle's ink format — knots, choices (* / ** / ***), inline
	tags after the choice text (# name: value), standalone-line tags inside a
	knot, diverts (-> target), INCLUDE, and comments. No variables, no logic,
	no string interpolation — so a small line-based parser is simpler than
	going through inklecate/inkjs and walking the compiled bytecode.
*/

class Tag {
	constructor( name, value ) {
		this.kind = 'tag';
		this.name = name;
		this.value = value;
	}

	static parse( raw ) {
		// "# name: value"
		var m = raw.match( /^\s*#\s*(\w+)\s*:\s*(.*?)\s*$/ );
		if ( ! m ) return null;
		return new Tag( m[1], m[2] );
	}

	parsedValue() {
		try {
			return JSON.parse( this.value );
		} catch ( e ) {
			return this.value;
		}
	}
}

class Divert {
	constructor( target ) {
		this.kind = 'divert';
		this.target = target;
	}

	static parse( raw ) {
		// "-> target"
		var m = raw.trim().match(/^->\s*(\S+)/);
		if ( ! m ) return null;
		return new Divert( m[1] );
	}

	isTerminator() {
		return this.target === 'DONE' || this.target === 'END';
	}
}

class Choice {
	constructor( depth, text, tag, divert ) {
		this.kind = 'choice';
		this.depth = depth;
		this.text = text;
		this.tag = tag;
		this.divert = divert;
	}

	static parse( raw ) {
		// "*[*...] body" — depth = number of leading asterisks
		var m = raw.trim().match(/^(\*+)\s*(.*)$/);
		if ( ! m ) return null;
		var depth = m[1].length;
		var body = m[2];
		var tag = null;
		var divert = null;

		// Either "* text # tag -> dest" or "* text -> dest # tag" appears
		// in WALTA's .ink. The divert regex captures an optional post-divert
		// tag in group 3, which gets folded back into the body so the tag
		// regex below sees a single canonical "text # tag" form.

		// "text -> target [# tag...]" — group 3 is the optional post-divert tag
		var divertMatch = body.match( /^(.*?)\s*->\s*(\S+)(?:\s*(#.*))?$/ );
		if ( divertMatch ) {
			body = divertMatch[1];
			divert = new Divert( divertMatch[2] );
			if ( divertMatch[3] ) body = body + ' ' + divertMatch[3];
		}
		// "text # tag..."
		var tagMatch = body.match( /^(.*?)\s*(#.*)$/ );
		if ( tagMatch ) {
			body = tagMatch[1];
			tag = Tag.parse( tagMatch[2] );
		}
		return new Choice( depth, body.trim(), tag, divert );
	}
}

class Include {
	constructor( lines ) {
		this.lines = lines;
	}

	static parse( raw, dir ) {
		// "INCLUDE filename.ink"
		var m = raw.match(/^\s*INCLUDE\s+(\S+)\s*$/);
		if ( ! m ) return null;
		var lines = fs.readFileSync( path.join( dir, m[1] ), 'utf-8' ).replace(/\r\n?/g, '\n').split('\n');
		return new Include( lines );
	}
}

class Knot {
	constructor( name, entries ) {
		this.name = name;
		this.entries = entries || [];
	}

	static parse( raw ) {
		// "=== knot_name ===" (trailing === optional)
		var m = raw.match(/^\s*={2,}\s*(\w+)\s*={0,}\s*$/);
		if ( ! m ) return null;
		return new Knot( m[1] );
	}

	add( entry ) {
		this.entries.push( entry );
	}

	choices() {
		return _.filter( this.entries, function( e ) { return e instanceof Choice; });
	}

	tags() {
		return _.filter( this.entries, function( e ) { return e instanceof Tag; });
	}

}

class InkDocument {
	constructor( inkPath ) {
		var dir = path.dirname( inkPath );
		this._lines = fs.readFileSync( inkPath, 'utf-8' ).replace(/\r\n?/g, '\n').split('\n');
		this._knots = [];
		var current = new Knot( '' );
		while ( this._lines.length > 0 ) {
			var line = this.readNextLine();
			var parsed = Include.parse( line, dir ) ?? Knot.parse( line ) ?? Choice.parse( line ) ?? Tag.parse( line ) ?? Divert.parse( line );
			if ( parsed instanceof Include ) {
				this._lines = this._lines.concat( parsed.lines );
			} else if ( parsed instanceof Knot ) {
				this._knots.push( current );
				current = parsed;
			} else if ( parsed != null ) {
				current.add( parsed );
			}
		}
		this._knots.push( current );
	}

	knot( name ) {
		return _.find( this._knots, ( k ) => k.name === name );
	}

	// Shift one logical line, scanning char-by-char to skip comments. If a
	// /* opens but doesn't close on this line, the do-while keeps pulling
	// lines until the block closes.
	readNextLine() {
		let outLine = '';
		let insideComment = false;
		do {
			let line
			if ( line = this._lines.shift() ) {
				let pos = 0
				do { 
					if ( insideComment ) {
						// swallow characters whilst we're inside a comment block
						if ( line.startsWith( '*/', pos ) ) { 
							insideComment = false
							pos++ 
						}
					} else if ( line.startsWith( '/*', pos ) ) { 
						insideComment = true
						pos++ 
					}
					else if ( line.startsWith( '//', pos ) ) { 
						break
					}
					else {
						outLine += line[pos]
					}
				} while ( ++pos < line.length )
			}
		} while ( insideComment );
		return outLine;
	}

}

/*
	A knot is either a TAXON (it contains a `# taxonId:` tag) or a NODE
	(containing choices). Taxa accumulate tag attributes and get linked
	under the parent Question; nodes have their choices walked, with each
	choice either linking to another knot via divert or to a synthetic
	sub-node formed by deeper-depth choices.
*/
class KeyBuilder {
	constructor( root ) {
		this._doc = new InkDocument( path.join( root, 'key.ink' ) );
		this._key = Key.createKey( { url: root } );
		this._building = {};
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
		if ( this._building[knotName] ) return this._building[knotName];

		const knot = this._doc.knot( knotName ) || new Knot( knotName );

		if ( this.isTaxon( knot ) ) {
			const taxon = Taxon.createTaxon( this.taxonArgs( knot ) );
			this._key.attachTaxon( taxon );
			this._building[knotName] = taxon;
			return taxon;
		}

		const node = Key.createKeyNode( { id: knotName } );
		this._key.attachNode( node );
		this._building[knotName] = node;

		const choices = knot.choices();
		let baseDepth = _.min( _.map( choices, ( c ) => c.depth ) );
		if ( ! _.isFinite( baseDepth ) ) baseDepth = 1;

		this.walkChoices( choices, baseDepth, node );
		return node;
	}

	buildAnonymousNode( choices, parentDepth ) {
		const node = Key.createKeyNode( {} );
		this._key.attachNode( node );

		let depthHere = parentDepth + 1;
		const actualDepths = _.uniq( _.map( choices, ( c ) => c.depth ) );
		if ( actualDepths.length ) depthHere = _.min( actualDepths );

		this.walkChoices( choices, depthHere, node );
		return node;
	}

	// Walk the choices that sit at exactly `depth`, attaching each as a
	// Question on `owner`. Deeper-depth choices become a nested anonymous
	// sub-node; same-depth siblings end the gather.
	walkChoices( choices, depth, owner ) {
		for ( let i = 0; i < choices.length; i++ ) {
			const c = choices[i];
			if ( c.depth !== depth ) continue;

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
				const nestedEntries = [];
				for ( let j = i + 1; j < choices.length; j++ ) {
					if ( choices[j].depth <= depth ) break;
					nestedEntries.push( choices[j] );
				}
				outcome = this.buildAnonymousNode( nestedEntries, depth );
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

exports.loadKey = ( root ) => new KeyBuilder( root ).buildKey();
exports.__test = { Tag, Divert, Choice, Knot, Include, InkDocument };
