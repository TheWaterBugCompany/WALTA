/*
 * walta/KeyNodeView
 * 
 * A mobile view that allows the identification of a critter species using a key.
 * 
 * taxonomy URI: http://localhost/walta-data/taxonomies/test/
 * 
 * 
 */
define( [ "dojo/_base/declare", "dojo/_base/lang", "dojo/aspect", "dojox/mobile/View", "walta/QuestionView"  ], 
	function( declare, lang, aspect, View, QuestionView ) {
		return declare( "walta.KeyNodeView", [View], {
			
			// public
			keyNode: null, // KeyNode
			
			"class": "waltaKeyNode",
			
			onChoose: function( id ) {}, // Fired when a question is choosen
			
			_createAndBindQuestion: function( id ) {
				var qv = new QuestionView( { question: this.keyNode.questions[id] } );
				aspect.after( qv, "onClick", lang.hitch( this, function() { this.onChoose( id ); } ) );
				this.addChild( qv );
			},
			
			postCreate: function() {
				this.inherited(arguments);
				for( var i = 0; i < this.keyNode.questions.length; i++ )
					this._createAndBindQuestion( i );
			}
		});
});