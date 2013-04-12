/*
 * walta/TaxonView
 * 
 * 
 */
define( [ "dojo/_base/declare", "dojo/aspect", "dojo/_base/lang", "dojo/dom-construct", "dojox/mobile/View", "dojox/mobile/Button" ], 
   function( declare, aspect, lang, domConstruct, View, Button ) {
	return declare( "walta.TaxonView", [View], {

		taxon: null, // Taxon
		
		"class": "waltaTaxon",
		
		onBack: function() {}, // Fires when on back pressed 
	
		buildRendering: function() {
			this.inherited(arguments);
			
			domConstruct.create("strong", { innerHTML: this.taxon.name }, this.containerNode );
			var b = new Button( { label: "Back", "class": "waltaBackButton", duration: 500 } );
			aspect.after( b, "onClick", lang.hitch( this, function() { this.onBack(); } ) );
			this.addChild( b );	
		}
		
	});
});