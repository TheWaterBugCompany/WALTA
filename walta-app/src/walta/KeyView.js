/*
 * walta/KeyView
 * 
 * A mobile view that allows the identification of a critter species using a key.
 * 
 * taxonomy URI: http://localhost/walta-data/taxonomies/test/
 * 
 * 
 */
define( [ "dojo/_base/declare", "dojo/aspect", "dojo/request/xhr", "dojo/_base/lang",  "dojox/mobile/View", "dojox/mobile/Heading", "walta/Key"  ], function( declare, aspect, xhr, lang, View, Heading, Key ) {
	return declare( "walta.KeyView", [View], {
		
		// public
		keyUrl: null,
		
		// API
		onKeyLoaded: function(){ }, // Called when the key has been loaded ready to populate the view.
								   // connect an aspect.after to be informed when this happens.
		
		// private
		_key: null,
		
		postCreate: function() {
			this.inherited(arguments);
			
			this._key = new Key( { url: this.keyUrl });

			this.addChild( new Heading({label: "Key Tree"}) );

		},
		
		startup: function() {
			this.inherited(arguments);
			
			// Load the key
			this._key.load().then( lang.hitch( this, function() { 
					// Fire the onKeyLoaded event
					this.onKeyLoaded(); 
				} 
			) );
		}
		
	});
});