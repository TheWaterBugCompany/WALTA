
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
		var line = raw.trim();
		if ( line.charAt(0) !== '#' ) return null;
		var body = line.slice(1).trim();
		var colon = body.indexOf(':');
		if ( colon === -1 ) return null;
		return new Tag( body.slice(0, colon).trim(), body.slice(colon + 1).trim() );
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

		var divIdx = body.indexOf('->');
		if ( divIdx !== -1 ) {
			var divPart = body.slice( divIdx + 2 ).trim();
			body = body.slice( 0, divIdx ).trim();
			// Either "* text # tag -> dest" or "* text -> dest # tag" appears
			// in WALTA's .ink. Hoist a tag found after the divert back into
			// the body so the # extractor below sees a single canonical form.
			var afterTagIdx = divPart.indexOf('#');
			if ( afterTagIdx !== -1 ) {
				body = body + ' ' + divPart.slice( afterTagIdx );
				divPart = divPart.slice( 0, afterTagIdx ).trim();
			}
			divert = Divert.parse( '-> ' + divPart );
		}
		var tagIdx = body.indexOf('#');
		if ( tagIdx !== -1 ) {
			tag = Tag.parse( body.slice( tagIdx ) );
			body = body.slice( 0, tagIdx ).trim();
		}
		return new Choice( depth, body.trim(), tag, divert );
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
	Parse a single content line into one of:
	  { kind: 'choice', depth: N, text: 'foo', tag: {name, value}?, divert: 'target'? }
	  { kind: 'tag', name: 'foo', value: 'bar' }
	  { kind: 'divert', target: 'foo' }
	  { kind: 'knot', name: 'foo' }
	  null  (blank or unrecognised)
	The 'tag' carried on a choice is the inline tag form (# name: value) that
	immediately precedes the divert; the standalone-line tag form maps to
	{kind: 'tag', ...}.
*/
function parseLine( raw ) {
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

/*
	Group parsed lines by knot. The lines before the first === knot ===
	header live under the synthetic name '' (the "root" entry point).
*/
function groupByKnot( parsed ) {
	var knots = { '': [] };
	var current = '';
	_.each( parsed, function( p ) {
		if ( ! p ) return;
		if ( p.kind === 'knot' ) {
			current = p.name;
			if ( ! knots[current] ) knots[current] = [];
		} else {
			knots[current].push( p );
		}
	});
	return knots;
}

/*
	A knot is either a TAXON (its first non-divert content is a `# taxonId:`
	tag) or a NODE (containing choices). Taxa accumulate tag attributes and
	get linked under the parent Question; nodes have their choices walked
	and either link to another knot via divert or into a synthetic sub-node
	formed by deeper-depth choices.

	`expandKnot` returns either a Taxon object or a KeyNode object.
*/
function expandKnot( knotName, knots, key, building ) {
	if ( building[knotName] ) return building[knotName];

	var entries = knots[knotName] || [];
	var isTaxon = _.any( entries, function( e ) {
		return e.kind === 'tag' && e.name === 'taxonId';
	} );

	if ( isTaxon ) {
		var taxonArgs = { id: knotName };
		_.each( entries, function( e ) {
			if ( e.kind === 'tag' ) taxonArgs[ e.name ] = e.parsedValue();
		});
		var taxon = Taxon.createTaxon( taxonArgs );
		key.attachTaxon( taxon );
		building[knotName] = taxon;
		return taxon;
	}

	var node = Key.createKeyNode( { id: knotName } );
	key.attachNode( node );
	building[knotName] = node;

	// A knot's content is a flat list of choices at depth 1 (or sometimes
	// deeper-only). Walk depth 1 choices and recursively gather their
	// nested deeper choices as a sub-node.
	var choices = _.filter( entries, function( e ) { return e instanceof Choice; });
	var baseDepth = _.min( _.map( choices, function( c ) { return c.depth; }) );
	if ( ! _.isFinite( baseDepth ) ) baseDepth = 1;

	for ( var i = 0; i < choices.length; i++ ) {
		var c = choices[i];
		if ( c.depth !== baseDepth ) continue;

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
			// Gather nested choices that belong to this branch (until next
			// same-depth or shallower sibling, or end of list).
			var nestedEntries = [];
			for ( var j = i + 1; j < choices.length; j++ ) {
				if ( choices[j].depth <= baseDepth ) break;
				nestedEntries.push( choices[j] );
			}
			outcome = buildAnonymousNode( nestedEntries, baseDepth, knots, key, building );
		}

		question.outcome = outcome;
		if ( outcome && outcome.parentLink === null ) outcome.parentLink = node;
		node.questions.push( question );
	}

	return node;
}

function buildAnonymousNode( choices, parentDepth, knots, key, building ) {
	var node = Key.createKeyNode( {} );
	key.attachNode( node );

	var depthHere = parentDepth + 1;
	var actualDepths = _.uniq( _.map( choices, function( c ) { return c.depth; }));
	if ( actualDepths.length ) depthHere = _.min( actualDepths );

	for ( var i = 0; i < choices.length; i++ ) {
		var c = choices[i];
		if ( c.depth !== depthHere ) continue;

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
				if ( choices[j].depth <= depthHere ) break;
				nestedEntries.push( choices[j] );
			}
			outcome = buildAnonymousNode( nestedEntries, depthHere, knots, key, building );
		}

		question.outcome = outcome;
		if ( outcome && outcome.parentLink === null ) outcome.parentLink = node;
		node.questions.push( question );
	}

	return node;
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
	var parsed = _.compact( _.map( stripComments( raw ), parseLine ) );
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
exports.__test = { Tag, Divert, Choice };
