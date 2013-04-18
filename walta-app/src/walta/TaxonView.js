/*
 * walta/TaxonView
 * 
 * 
 */
define( [ "dojo/_base/declare", "dojo/aspect", "dojo/_base/lang", "dojo/dom-construct", "dojox/mobile/View", "dojox/mobile/Button", "walta/AnchorBar", "walta/MediaView" ], 
   function( declare, aspect, lang, domConstruct, View, Button, AnchorBar, MediaView ) {
	return declare( "walta.TaxonView", [View], {

		taxon: null, // Taxon
		
		"class": "waltaTaxon waltaFullscreen",
		
		onBack: function() {}, // Fires when on back pressed 
	
		buildRendering: function() {
			this.inherited(arguments);
			
			var ab = new AnchorBar( { title: "ALT Key" } );
			this.addChild(ab);
			
			domConstruct.create("h5", { innerHTML: this.taxon.name }, this.containerNode );
			domConstruct.create("h5", { innerHTML: "(" + this.taxon.commonName + ")" }, this.containerNode );
			
			var details = domConstruct.create("div", { "class" : "waltaPanel" }, this.containerNode );
			this._buildNamedField( details, "Size", "Up to " + this.taxon.size + "mm." );
			this._buildNamedField( details, "Habitat", this.taxon.habitat  );
			this._buildNamedField( details, "Movement", this.taxon.movement  );
			this._buildNamedField( details, "Confused with", this.taxon.confusedWith );
			this._buildNamedField( details, "SIGNAL score",  this.taxon.signalScore );

			if ( this.taxon.mediaUrls[0] ) {
				this.addChild( new MediaView( { mediaUrls: this.taxon.mediaUrls } ) );
			}
			
			this._buildButton( "Go back and try again", "waltaGoBack", lang.hitch( this, function() { this.onBack(); } ) );
			this._buildButton( "Photo gallery", "waltaGallery", lang.hitch( this, function() { this.onBack(); } ) );
			
			this._buildButton( "Watch video", "waltaVideo", lang.hitch( this, function() { this.onBack(); } ) );
			this._buildButton( "Listen to audio", "waltaAudio", lang.hitch( this, function() { this.onBack(); } ) );
			this._buildButton( "Nerd Notes", "waltaNotes", lang.hitch( this, function() { this.onBack(); } ) );
			this._buildButton( "Email Info", "waltaEmail", lang.hitch( this, function() { this.onBack(); } ) );
			this._buildButton( "Post to facebook", "waltaFacebook", lang.hitch( this, function() { this.onBack(); } ) );
			this._buildButton( "Post to Twitter", "waltaTwitter", lang.hitch( this, function() { this.onBack(); } ) );
			
		},
		
		_buildNamedField: function( parent, label, text) {		
			if ( text != "" ) {
				var field = domConstruct.create("p", {}, parent );
				domConstruct.create("strong", { innerHTML: label + ":" }, field );
				domConstruct.create("span", { innerHTML: text }, field );
			}
		},
		
		_buildButton: function( label, className, onclick ) {
			var b = new Button( { label: label, "class": "waltaActionIcon " + className, duration: 500 } );
			aspect.after( b, "onClick", onclick );
			this.addChild( b );
		}
		
	});
});