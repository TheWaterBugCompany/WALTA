/*
 * walta/TaxonView
 * 
 * 
 */
define( [ "dojo/_base/declare", "dojo/aspect", "dojo/_base/lang",  "dojox/mobile/ContentPane", "dojox/mobile/Button" ], function( declare, aspect, lang, ContentPane, Button ) {
	return declare( "walta.TaxonView", [ContentPane], {

		taxon: null, // Taxon
		
		"class": "waltaTaxon",
		
		onBack: function() {}, // Fires when on back pressed 
		
		postMixInProperties: function() {
			this.inherited(arguments);
			this.content = "<strong>" + this.taxon.name + "</strong>";
		},
	
		postCreate: function() {
			var b = new Button( { label: "Back", "class": "waltaBackButton", duration: 500 } );
			aspect.after( b, "onClick", lang.hitch( this, function() { this.onBack(); } ) );
			this.addChild( b );
		}
		
	});
});