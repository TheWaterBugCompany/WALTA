/*
 * walta/KeyTree
 * 
 * A mobile view that allows the selection of a critter species.
 * 
 * 
 */
define( [ "dojo/_base/declare", "dojox/mobile/View", "dojox/mobile/Heading" ], function( declare, View, Heading ) {
	return declare( "walta.KeyTree", [View], {
		postCreate: function() {
			this.inherited(arguments);
			this.addChild( new Heading({label: "Key Tree"}) );
		}
		
	});
});