define( [ "dojo/_base/declare", "dojo/_base/array", "dojo/_base/lang", "walta/KeyNode" ], function( declare, array, lang, KeyNode ) {
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
		
		parent: null
	});
});