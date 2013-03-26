/*
 * walta/QuestionView
 *
 * Represents a single question
 *  
 */
define( [ "dojo/_base/declare", "dojo/aspect", "dojo/_base/lang", "dojox/mobile/Container", "dojox/mobile/Button"  ], 
	function( declare, aspect, lang, Container,  Button ) {
		return declare( "walta.KeyNodeView", [Container], {
			
			// public
			question: null, // KeyNode
			
			onClick: function() {}, // Fires this event if this question was selected
			
			postCreate: function() {
				this.inherited(arguments);
				
				var b = new Button( { label: this.question.text, class: "question", duration: 500 } );
				this.addChild( b );
				
				aspect.after( b, "onClick", lang.hitch( this, function() { this.onClick(); }  ) );
				
			}
		});
});