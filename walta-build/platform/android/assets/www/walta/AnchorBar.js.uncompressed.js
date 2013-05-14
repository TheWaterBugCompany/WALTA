/*
 * walta/AnchorBar
 */
define( "walta/AnchorBar", [ "dojo/_base/declare", "dojo/on", "dojo/dom-construct", "dojo/_base/lang", "dojo/topic", "dojox/mobile/Container" ], 
	function( declare, on, domConstruct, lang, topic, Container ) {
		return declare( "walta.AnchorBar", [Container], {
			
			// public
			title: "",
			
			"class": "waltaAnchorBar", 

			buildRendering: function() {
				this.inherited(arguments);
				var home = domConstruct.create("div", { "class": "waltaAnchorBarIcon waltaHome" }, this.containerNode );
				
				
				var info = domConstruct.create("div", { "class": "waltaAnchorBarIcon waltaInfo" }, this.containerNode );
				var settings = domConstruct.create("div", { "class": "waltaAnchorBarIcon waltaSettings" }, this.containerNode );
				
				domConstruct.create("h1", { innerHTML: this.title}, this.containerNode );	
				
				on( home, "click", lang.hitch( this, function(e) { topic.publish("anchorbar/home"); } ) );
				on( settings, "click", lang.hitch( this, function(e) { topic.publish("anchorbar/settings"); } ) );
				on( info, "click", lang.hitch( this, function(e) { topic.publish("anchorbar/info"); } ) );
				
			}
		});
});