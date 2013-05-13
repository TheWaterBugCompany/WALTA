/*
 * walta/SpeedBugTile
 *
 * Creates a tile for the SpeedBug widget
 *  
 */
define( [ "dojo/_base/declare", "dojo/_base/lang", "dojo/dom-construct", "dojo/on", "dojo/topic", "dojox/mobile/Pane", "dijit/_Contained" ], 
	function( declare, lang, domConstruct, on, topic, Pane, Contained ) {
		return declare( "walta.SpeedBugTile", [Pane, Contained], {
			image: "",
			ref: "",
			baseClass: "waltaSpeedBugTile",
			buildRendering: function() {
				this.inherited(arguments);
				var tile = domConstruct.create("img", { "class":"waltaSpeedBugImage", src: this.image }, this.containerNode );
				on( tile, "click", lang.hitch( this, function(e) { topic.publish("key/jump", this.ref ); } ) );
			}
		});
});