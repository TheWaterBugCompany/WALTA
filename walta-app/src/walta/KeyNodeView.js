/*
 * walta/KeyNodeView
 * 
 * A mobile view that allows the identification of a critter species using a key.
 * 
 * taxonomy URI: http://localhost/walta-data/taxonomies/test/
 * 
 * 
 */
define( [ "dojo/_base/declare", "dojo/_base/lang", "dojo/aspect", "dojo/dom-construct", "dojox/mobile/View", "dojox/mobile/Button", "dojox/mobile/Container", "walta/QuestionView", "walta/AnchorBar"  ], 
	function( declare, lang, aspect, domConstruct, View, Button, Container, QuestionView, AnchorBar ) {
		return declare( "walta.KeyNodeView", [View], {
			
			// public
			keyNode: null, // KeyNode
			
			"class": "waltaFullscreen waltaKey",
			
			onChoose: function( id ) {}, // Fired when a question is choosen
			onBack: function() {}, // Fired when the back button is pressed
			
			_createAndBindQuestion: function( id, parent ) {
				
				var qv = new QuestionView( { question: this.keyNode.questions[id] } );
				aspect.after( qv, "onClick", lang.hitch( this, function() { this.onChoose( id ); } ) );
				parent.addChild( qv );
			},
			
			buildRendering: function() {
				this.inherited(arguments);
				var ab = new AnchorBar( { title: "ALT Key" } );
				this.addChild(ab);
				
				domConstruct.create("h4", { innerHTML: "Choose the best match" }, this.containerNode );
				
				
				var questions = new Container( { "class" : "waltaQuestionContainer" } );
				
				for( var i = 0; i < this.keyNode.questions.length; i++ )
					this._createAndBindQuestion( i, questions );
				
				this.addChild( questions );
				
				var b = new Button( { label: "No match? Go back", "class": "waltaBackButton",  duration: 500 } );
				aspect.after( b, "onClick", lang.hitch( this, function() { this.onBack(); } ) );
				this.addChild( b );
				
			}
		});
});