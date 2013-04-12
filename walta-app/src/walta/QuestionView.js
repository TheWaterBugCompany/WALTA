/*
 * walta/QuestionView
 *
 * Represents a single question
 *  
 */
define( [ "dojo/_base/declare", "dojo/on", "dojo/dom-construct", "dojo/_base/lang", "dojox/mobile/Container" ], 
	function( declare, on, domConstruct, lang, Container ) {
		return declare( "walta.QuestionView", [Container], {
			
			// public
			question: null, // KeyNode
			
			onClick: function() {}, // Fires this event if this question was selected
			
			"class": "waltaQuestion", 
			
			buildRendering: function() {
				this.inherited(arguments);
				domConstruct.create("p", { innerHTML: this.question.text }, this.containerNode );
				
				// put the first image in the question itself
				if ( this.question.mediaUrls[0] ) {
					var cell = domConstruct.create("div", { "class":"waltaImageContainer" }, this.containerNode );
					domConstruct.create("img", { src: this.question.mediaUrls[0] }, cell );
				}
				
				// connect events
				on( this.containerNode, "click", lang.hitch( this, function(e) { this.onClick(); } ) );
				
			}
		});
});