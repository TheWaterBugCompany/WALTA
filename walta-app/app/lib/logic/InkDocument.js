
var _ = require('underscore');
var fs = require('fs');
var path = require('path');

/*
	Reads .ink source files into a structured document of knots, choices,
	tags, and diverts. WALTA uses only a tiny subset of Inkle's ink format —
	knots, choices (* / ** / ***), inline tags after the choice text
	(# name: value), standalone-line tags inside a knot, diverts
	(-> target), INCLUDE, and comments. No variables, no logic, no string
	interpolation — so a small line-based parser is simpler than going
	through inklecate/inkjs and walking the compiled bytecode.
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

exports.Tag = Tag;
exports.Divert = Divert;
exports.Choice = Choice;
exports.Include = Include;
exports.Knot = Knot;
exports.InkDocument = InkDocument;
