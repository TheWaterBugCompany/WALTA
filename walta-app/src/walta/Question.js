define( [ "dojo/_base/declare", "dojo/_base/array", "dojo/_base/lang", "walta/Taxon" ], function( declare, array, lang, Taxon ) {
	return declare( null, {
		text: null,			  // The text to be displayed to the user
		mediaUrls: [],		  // A list of media items to be displayed (can be images, sound or movies)
		outcome: null         // Node to jump to on correct outcome
	});
});