define( [ "dojo/_base/declare", "dojo/_base/array", "dojo/_base/lang", "walta/Taxon" ], function( declare, array, lang, Taxon ) {
	return declare( null, {
		text: null,			// The text to be displayed to the user
		mediaUrls: [],		// A list of media items to be displayed (can be images, sound or movies)
		outcome: null,      // A function that returns the outcome result
		
		constructor: function( KeyNode, baseUri, doc, node  ) {
			this.text = doc.getString( node, "tax:text");
			this.mediaUrls = [];
			array.forEach(
				doc.getStringArray( node, "child::tax:mediaRef/@url" ),
					lang.hitch( this, function( ref ) {
						this.mediaUrls.push( baseUri + "/media/" + ref );
				}));
			this.outcome = this._buildOutcomeFunction( KeyNode, baseUri, doc, node, doc.getNumber( node, "@num" ) );
		},
		
		_buildOutcomeFunction: function( KeyNode, baseUri, doc, node, num ) {
			return function() {
				var outcome = doc.getNode( node, "../tax:outcome[@for=" + num + "]/*");
				if ( outcome.tagName === "taxonLink"  ) {
					var ref = doc.getString( outcome, "@ref" );
					var taxon = doc.getNode( null, "/tax:key//tax:taxon[@id='" + ref + "']");
					var parent = doc.getNode( node, ".." );
					return new Taxon( KeyNode, baseUri, doc, parent, taxon );
				} else if ( outcome.tagName === "keyNode" ) {
					return new KeyNode( baseUri, doc, outcome );
				} else if ( outcome.tagName === "keyNodeLink"){
					var ref = doc.getString( outcome, "@ref" );
					var keyNode = doc.getNode( null, "/tax:key//tax:keyNode[@id='" + ref + "']");
					return new KeyNode( baseUri, doc, keyNode );
				}
			};
		}
		
		
	});
});