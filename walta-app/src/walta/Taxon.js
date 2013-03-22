define( [ "dojo/_base/declare", "dojo/_base/array", "dojo/_base/lang" ], function( declare, array, lang ) {
	return declare( null, {
		
		id: null,			// XML based id
		name: "",			// User readable species scientific name
		commonName: "",		// Common name for species
		size: 0,			// Size in mm
		signalScore: 0,		// The signal score scalar
		
		habitat: "",		// Description of habitat
		movement: "",		// Description of how species moves
		confusedWith: "",   // This species is often confused with
		
		mediaUrls: [],		// List of media URLs
	
		constructor: function( baseUri, doc, node ) {
			this.id = doc.getString( node, "@id" );
			this.name = doc.getString( node, "@name" );
			this.commonName = doc.getString( node, "@commonName" );
			this.size = doc.getNumber( node, "@size" );
			this.signalScore = doc.getNumber( node, "@signalScore" );
			this.habitat = doc.getString( node, "tax:habitat");
			this.movement = doc.getString( node, "tax:movement");
			this.confusedWith = doc.getString( node, "tax:confusedWith");
			this.mediaUrls = [];
			array.forEach(
				doc.getStringArray( node, "child::tax:mediaRef/@url" ),
					lang.hitch( this, function( ref ) {
						this.mediaUrls.push( baseUri + "/media/" + ref );
				}));
		}
	});
});