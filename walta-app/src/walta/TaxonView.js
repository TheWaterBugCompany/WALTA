/*
 * walta/TaxonView
 * 
 * 
 */
define( [ "dojo/_base/declare", "dojo/_base/lang",  "dojox/mobile/ContentPane" ], function( declare, lang, ContentPane ) {
	return declare( "walta.TaxonView", [ContentPane], {

		taxon: null, // Taxon
		
		postMixInProperties: function() {
			this.inherited(arguments);
			this.content = "<strong>" + this.taxon.name + "</strong>";
		}
		
	});
});