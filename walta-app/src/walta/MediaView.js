/*
 * walta/MediaView
 *
 * Creates a thumbnail image with a zoom to gallery icon.
 *  
 */
define( [ "dojo/_base/declare", "dojo/on", "dojo/dom-construct", "dojo/_base/lang", "dojox/mobile/Pane" ], 
	function( declare, on, domConstruct, lang, Pane ) {
		return declare( "walta.MediaView", [Pane], {
			
			mediaUrls: [],
			
			"class": "waltaImageContainer", 
			
			buildRendering: function() {
				this.inherited(arguments);
				var cn = domConstruct.create("div", { "class" : "waltaImageInner" }, this.containerNode );
				if ( this.mediaUrls[0] ) {
					domConstruct.create("img", { src: this.mediaUrls[0] }, cn );
					domConstruct.create("div", { "class" : "waltaZoom" }, cn );
				}
				
			}
		});
});