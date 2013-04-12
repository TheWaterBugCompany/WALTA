/*
 * walta/AnchorBar
 */
define( "walta/AnchorBar", [ "dojo/_base/declare", "dojo/on", "dojo/dom-construct", "dojo/_base/lang", "dojox/mobile/Container" ], 
	function( declare, on, domConstruct, lang, Container ) {
		return declare( "walta.AnchorBar", [Container], {
			
			// public
			title: "",
			
			"class": "waltaAnchorBar", 
			
			onHome: null,
			onSettings: null,
			onInfo: null,
			
			buildRendering: function() {
				this.inherited(arguments);
				var home = domConstruct.create("div", { "class": "waltaHome" }, this.containerNode );
				domConstruct.create("h1", { innerHTML: this.title}, this.containerNode );	
				
				var info = domConstruct.create("div", { "class": "waltaInfo" }, this.containerNode );
				var settings = domConstruct.create("div", { "class": "waltaSettings" }, this.containerNode );
				
				
				on( home, "click", lang.hitch( this, function(e) { this.onHome(); } ) );
				on( settings, "click", lang.hitch( this, function(e) { this.onSettings(); } ) );
				on( info, "click", lang.hitch( this, function(e) { this.onInfo(); } ) );
				
			}
		});
});