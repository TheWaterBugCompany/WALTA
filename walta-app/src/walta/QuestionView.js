/*
 * walta/QuestionView
 *
 * Represents a single question
 *  
 */
define( [ "dojo/_base/declare", "dojo/on", "dojo/dom-construct", "dojo/_base/lang", "dojox/mobile/Container", "walta/MediaView" ], 
	function( declare, on, domConstruct, lang, Container, MediaView ) {
		return declare( "walta.QuestionView", [Container], {
			
			// public
			question: null, // KeyNode
			
			onClick: function() {}, // Fires this event if this question was selected
			
			"class": "waltaQuestion", 
			
			buildRendering: function() {
				this.inherited(arguments);
				domConstruct.create("p", { innerHTML: this.question.text }, this.containerNode );
				
				if ( this.question.mediaUrls[0] ) {
					this.addChild( new MediaView( { mediaUrls: this.question.mediaUrls } ) );
				}
				
				
				// connect events
				on( this.containerNode, "click", lang.hitch( this, function(e) { this.onClick(); } ) );
				
			}
		});
});