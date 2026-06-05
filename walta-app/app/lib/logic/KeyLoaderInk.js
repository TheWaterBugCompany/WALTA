
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var Key = require('./Key');
var Taxon = require('./Taxon');
var Question = require('./Question');
var SpeedbugIndex = require('./SpeedbugIndex');
var splitByFirst = require('../util/splitByFirst');

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
		var line = raw.trim();
		if ( line.charAt(0) !== '#' ) return null;
		var parts = splitByFirst( line.slice(1), ':' );
		if ( ! parts ) return null;
		return new Tag( parts[0], parts[1] );
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
		var m = raw.trim().match(/^(\*+)\s*(.*)$/);
		if ( ! m ) return null;
		var depth = m[1].length;
		var body = m[2];
		var tag = null;
		var divert = null;

		var divertSplit = splitByFirst( body, '->' );
		if ( divertSplit ) {
			var divPart;
			[ body, divPart ] = divertSplit;
			// Either "* text # tag -> dest" or "* text -> dest # tag" appears
			// in WALTA's .ink. Hoist a tag found after the divert back into
			// the body so the # extractor below sees a single canonical form.
			var hoist = splitByFirst( divPart, '#' );
			if ( hoist ) {
				var hoistTagBody;
				[ divPart, hoistTagBody ] = hoist;
				body = body + ' #' + hoistTagBody;
			}
			divert = Divert.parse( '-> ' + divPart );
		}
		var tagSplit = splitByFirst( body, '#' );
		if ( tagSplit ) {
			var tagBody;
			[ body, tagBody ] = tagSplit;
			tag = Tag.parse( '#' + tagBody );
		}
		return new Choice( depth, body, tag, divert );
	}
}

/*
	Parse a single content line into one of:
	  Choice    (a * / ** / *** entry, optionally with an inline tag and/or divert)
	  Tag       (a standalone # name: value line)
	  Divert    (a standalone -> target line)
	  { kind: 'knot', name }   (a === knot === header)
	  null      (blank or unrecognised)
*/
class Knot {
	constructor( name, entries ) {
		this.name = name;
		this.entries = entries || [];
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

	isTaxon() {
		return _.any( this.tags(), function( t ) { return t.name === 'taxonId'; });
	}

	taxonArgs() {
		var args = { id: this.name };
		_.each( this.tags(), function( t ) { args[ t.name ] = t.parsedValue(); });
		return args;
	}
}

class Node {
	static parse( raw ) {
		var line = raw.trim();
		if ( ! line ) return null;

		var knot = line.match(/^={2,}\s*(\w+)\s*={0,}$/);
		if ( knot ) return { kind: 'knot', name: knot[1] };

		var choice = Choice.parse( line );
		if ( choice ) return choice;

		if ( line.charAt(0) === '#' ) {
			return Tag.parse( line );
		}

		return Divert.parse( line );
	}
}

function loadInkLines( inkPath ) {
	var dir = path.dirname( inkPath );
	var text = fs.readFileSync( inkPath, 'utf-8' );
	// Normalise CRLF -> LF so the parser doesn't need to think about it.
	var lines = text.replace(/\r\n?/g, '\n').split('\n');
	var ownLines = [];
	var included = [];
	// Push INCLUDE'd content after the parent file's own content so any
	// loose root-level lines in the parent (e.g. key.ink's top-level menu
	// choices, written below the INCLUDE) reach the synthetic root knot
	// before being shadowed by the first === knot === in the include.
	_.each( lines, function( line ) {
		var inc = line.match(/^\s*INCLUDE\s+(\S+)\s*$/);
		if ( inc ) {
			included = included.concat( loadInkLines( path.join( dir, inc[1] ) ) );
		} else {
			ownLines.push( line );
		}
	});
	return ownLines.concat( included );
}

function stripComments( lines ) {
	var out = [];
	var inBlock = false;
	_.each( lines, function( line ) {
		if ( inBlock ) {
			var endIdx = line.indexOf('*/');
			if ( endIdx === -1 ) {
				out.push( '' );
				return;
			}
			line = line.slice( endIdx + 2 );
			inBlock = false;
		}
		while ( true ) {
			var startIdx = line.indexOf('/*');
			if ( startIdx === -1 ) break;
			var endIdx = line.indexOf('*/', startIdx + 2);
			if ( endIdx === -1 ) {
				line = line.slice( 0, startIdx );
				inBlock = true;
				break;
			}
			line = line.slice( 0, startIdx ) + line.slice( endIdx + 2 );
		}
		var lineIdx = line.indexOf('//');
		if ( lineIdx !== -1 ) line = line.slice( 0, lineIdx );
		out.push( line );
	});
	return out;
}

/*
	Group parsed lines by knot. The lines before the first === knot ===
	header live under the synthetic name '' (the "root" entry point).
*/
function groupByKnot( parsed ) {
	var knots = { '': new Knot('') };
	var current = '';
	_.each( parsed, function( p ) {
		if ( ! p ) return;
		if ( p.kind === 'knot' ) {
			current = p.name;
			if ( ! knots[current] ) knots[current] = new Knot( current );
		} else {
			knots[current].add( p );
		}
	});
	return knots;
}

/*
	A knot is either a TAXON (it contains a `# taxonId:` tag) or a NODE
	(containing choices). Taxa accumulate tag attributes and get linked
	under the parent Question; nodes have their choices walked, with each
	choice either linking to another knot via divert or to a synthetic
	sub-node formed by deeper-depth choices.

	`expandKnot` returns either a Taxon or a KeyNode.
*/
function expandKnot( knotName, knots, key, building ) {
	if ( building[knotName] ) return building[knotName];

	var knot = knots[knotName] || new Knot( knotName );

	if ( knot.isTaxon() ) {
		var taxon = Taxon.createTaxon( knot.taxonArgs() );
		key.attachTaxon( taxon );
		building[knotName] = taxon;
		return taxon;
	}

	var node = Key.createKeyNode( { id: knotName } );
	key.attachNode( node );
	building[knotName] = node;

	var choices = knot.choices();
	var baseDepth = _.min( _.map( choices, function( c ) { return c.depth; }) );
	if ( ! _.isFinite( baseDepth ) ) baseDepth = 1;

	walkChoices( choices, baseDepth, knots, key, building, node );
	return node;
}

function buildAnonymousNode( choices, parentDepth, knots, key, building ) {
	var node = Key.createKeyNode( {} );
	key.attachNode( node );

	var depthHere = parentDepth + 1;
	var actualDepths = _.uniq( _.map( choices, function( c ) { return c.depth; }));
	if ( actualDepths.length ) depthHere = _.min( actualDepths );

	walkChoices( choices, depthHere, knots, key, building, node );
	return node;
}

// Walk the choices that sit at exactly `depth`, attaching each as a
// Question on `owner`. Deeper-depth choices become a nested anonymous
// sub-node; same-depth siblings end the gather.
function walkChoices( choices, depth, knots, key, building, owner ) {
	for ( var i = 0; i < choices.length; i++ ) {
		var c = choices[i];
		if ( c.depth !== depth ) continue;

		var question = { text: c.text };
		if ( c.tag && c.tag.name === 'mediaUrls' ) {
			question.mediaUrls = c.tag.parsedValue();
			if ( ! _.isArray( question.mediaUrls ) ) question.mediaUrls = [ question.mediaUrls ];
		}
		question = Question.createQuestion( question );

		var outcome;
		if ( c.divert ) {
			outcome = c.divert.isTerminator()
				? null
				: expandKnot( c.divert.target, knots, key, building );
		} else {
			var nestedEntries = [];
			for ( var j = i + 1; j < choices.length; j++ ) {
				if ( choices[j].depth <= depth ) break;
				nestedEntries.push( choices[j] );
			}
			outcome = buildAnonymousNode( nestedEntries, depth, knots, key, building );
		}

		question.outcome = outcome;
		if ( outcome && outcome.parentLink === null ) outcome.parentLink = owner;
		owner.questions.push( question );
	}
}

/*
	The root entry point (the '' synthetic knot) is the menu of top-level
	choices: "ALT Key", "Mayfly Muster Speedbug", "Speedbug", "Order
	Speedbug", "Mayfly start point". The taxonomy lives under "ALT Key" and
	becomes the actual root of the Key. The three speedbug entries become
	SpeedbugIndex objects. "Mayfly start point" is unused.
*/
function buildSpeedbugIndex( speedbugName, rootMenu, key ) {
	var entry = _.find( rootMenu.questions, function( q ) { return q.text.trim() === speedbugName; });
	if ( ! entry ) return;
	var speedBugNode = entry.outcome;
	key.dettachNode( speedBugNode );

	var index = SpeedbugIndex.createSpeedbugIndex( speedbugName );

	// Speedbug imgUrl is always a single string downstream (the silhouette
	// is one image), even though questions in general carry mediaUrls as an
	// array. Unwrap here so the SpeedbugIndex tile renders a path string,
	// not a path array.
	var firstUrl = function( q ) {
		return q && q.mediaUrls && q.mediaUrls.length ? q.mediaUrls[0] : undefined;
	};

	_.each( speedBugNode.questions, function( q ) {
		var sub = q.outcome;
		if ( q.text && sub && sub.questions && sub.questions[0] && (sub.questions[0].text || '').trim().toLowerCase() === 'not sure' ) {
			var notSure = sub.questions.shift();
			var groupId = notSure.outcome.id;
			index.addSpeedbugGroup( groupId );
			_.each( sub.questions, function( q2 ) {
				index.addSpeedbugIndex( firstUrl( q2 ), groupId, q2.outcome.id );
			});
		} else if ( sub ) {
			index.addSpeedbugGroup( sub.id );
			index.addSpeedbugIndex( firstUrl( q ), sub.id, sub.id );
		}
	});

	key.addSpeedbugIndex( index );
}

function loadKey( root ) {
	var inkPath = path.join( root, 'key.ink' );
	var raw = loadInkLines( inkPath );
	var parsed = _.compact( _.map( stripComments( raw ), Node.parse ) );
	var knots = groupByKnot( parsed );

	var key = Key.createKey( { url: root });
	var rootMenu = expandKnot( '', knots, key, {} );
	key.setRootNode( rootMenu );

	var altKeyQ = rootMenu.findQuestion( 'ALT Key' );
	if ( altKeyQ ) {
		var altKey = altKeyQ.outcome;
		key.dettachNode( rootMenu );
		altKey.parentLink = null;
		key.setRootNode( altKey );
	}

	_.each( [ 'Speedbug', 'Mayfly Muster Speedbug', 'Order Speedbug' ], function( name ) {
		buildSpeedbugIndex( name, rootMenu, key );
	});

	return key;
}

exports.loadKey = loadKey;
exports.__test = { Tag, Divert, Choice, Node, Knot };
